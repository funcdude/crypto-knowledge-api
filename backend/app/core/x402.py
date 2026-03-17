"""X402 Payment Protocol Implementation"""

import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx
from web3 import Web3
from eth_account import Account
from eth_utils import to_checksum_address
import structlog

from app.core.config import get_settings, format_price_for_usdc

logger = structlog.get_logger()

@dataclass
class PaymentRequirement:
    """X402 payment requirement data structure"""
    chain_id: int
    to: str
    amount: str  # In wei/smallest unit
    currency: str
    description: str
    price_usd: float
    expires_at: Optional[datetime] = None

@dataclass 
class PaymentProof:
    """X402 payment proof data structure"""
    transaction_hash: str
    from_address: str
    to_address: str
    amount: str
    currency: str
    chain_id: int
    timestamp: datetime
    block_number: Optional[int] = None

class X402Manager:
    """Manages X402 payment flows and verification"""
    
    def __init__(
        self, 
        payment_address: str,
        chain_id: int = 8453,  # Base
        facilitator_url: str = "https://facilitator.coinbase.com"
    ):
        self.payment_address = to_checksum_address(payment_address)
        self.chain_id = chain_id
        self.facilitator_url = facilitator_url
        self.settings = get_settings()
        
        # Initialize Web3 connection for Base
        if chain_id == 8453:  # Base
            self.w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
        else:
            self.w3 = Web3(Web3.HTTPProvider("https://eth-mainnet.alchemyapi.io/v2/your-key"))
            
        # USDC contract address on Base
        self.usdc_address = to_checksum_address("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")
        
        # USDC ABI (minimal - just what we need)
        self.usdc_abi = [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf", 
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ]
        
        self.usdc_contract = self.w3.eth.contract(
            address=self.usdc_address,
            abi=self.usdc_abi
        )
        
    def create_payment_requirement(
        self,
        tier: str,
        description: str,
        request_id: Optional[str] = None
    ) -> PaymentRequirement:
        """Create X402 payment requirement"""
        
        from app.core.config import get_pricing_config
        pricing = get_pricing_config()
        
        if tier not in pricing:
            raise ValueError(f"Invalid pricing tier: {tier}")
        
        tier_config = pricing[tier]
        price_usd = tier_config["price"]
        
        return PaymentRequirement(
            chain_id=self.chain_id,
            to=self.payment_address,
            amount=format_price_for_usdc(price_usd),
            currency="USDC",
            description=f"{description} ({tier_config['description']})",
            price_usd=price_usd,
            expires_at=datetime.utcnow() + timedelta(minutes=10)
        )
    
    def format_402_response(self, payment_req: PaymentRequirement) -> Dict[str, Any]:
        """Format HTTP 402 Payment Required response"""
        return {
            "error": "Payment required",
            "payment": {
                "chainId": payment_req.chain_id,
                "to": payment_req.to,
                "amount": payment_req.amount,
                "currency": payment_req.currency,
                "contract": self.usdc_address if payment_req.currency == "USDC" else None
            },
            "description": payment_req.description,
            "price_usd": payment_req.price_usd,
            "expires_at": payment_req.expires_at.isoformat() if payment_req.expires_at else None,
            "facilitator": self.facilitator_url
        }
    
    def parse_payment_header(self, payment_header: str) -> Dict[str, Any]:
        """Parse X-Payment header from X402 request"""
        try:
            # Handle both JSON and simple formats
            if payment_header.startswith("{"):
                return json.loads(payment_header)
            else:
                # Simple format: "tx_hash:chain_id" or just "tx_hash"
                parts = payment_header.split(":")
                return {
                    "transaction_hash": parts[0],
                    "chain_id": int(parts[1]) if len(parts) > 1 else self.chain_id
                }
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("Failed to parse payment header", header=payment_header, error=str(e))
            raise ValueError(f"Invalid payment header format: {e}")
    
    async def verify_payment(
        self,
        payment_data: Dict[str, Any],
        expected_amount: str,
        expected_recipient: Optional[str] = None
    ) -> PaymentProof:
        """Verify payment on blockchain"""
        
        tx_hash = payment_data.get("transaction_hash")
        chain_id = payment_data.get("chain_id", self.chain_id)
        
        if not tx_hash:
            raise ValueError("Transaction hash required")
            
        if chain_id != self.chain_id:
            raise ValueError(f"Invalid chain ID: {chain_id}")
        
        try:
            # Get transaction receipt
            tx_receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            tx = self.w3.eth.get_transaction(tx_hash)
            
            if tx_receipt.status != 1:
                raise ValueError("Transaction failed")
            
            # Verify it's a USDC transfer to our address
            if tx.to.lower() != self.usdc_address.lower():
                raise ValueError("Not a USDC transaction")
            
            # Parse transfer logs to get actual transfer details
            transfer_data = self._parse_usdc_transfer(tx_receipt)
            
            if not transfer_data:
                raise ValueError("No USDC transfer found in transaction")
            
            # Verify recipient
            recipient = expected_recipient or self.payment_address
            if transfer_data["to"].lower() != recipient.lower():
                raise ValueError(f"Payment sent to wrong address: {transfer_data['to']}")
            
            # Verify amount (allow small tolerance for fees)
            expected_amount_int = int(expected_amount)
            actual_amount_int = int(transfer_data["amount"])
            
            if actual_amount_int < expected_amount_int * 0.95:  # 5% tolerance
                raise ValueError(
                    f"Insufficient payment: expected {expected_amount_int}, got {actual_amount_int}"
                )
            
            return PaymentProof(
                transaction_hash=tx_hash,
                from_address=transfer_data["from"],
                to_address=transfer_data["to"],
                amount=transfer_data["amount"],
                currency="USDC",
                chain_id=chain_id,
                timestamp=datetime.utcnow(),  # Could get block timestamp
                block_number=tx_receipt.blockNumber
            )
            
        except Exception as e:
            logger.error(
                "Payment verification failed", 
                tx_hash=tx_hash, 
                error=str(e)
            )
            raise ValueError(f"Payment verification failed: {e}")
    
    def _parse_usdc_transfer(self, tx_receipt) -> Optional[Dict[str, Any]]:
        """Parse USDC transfer from transaction logs"""
        
        # Transfer event signature
        transfer_sig = self.w3.keccak(text="Transfer(address,address,uint256)").hex()
        
        for log in tx_receipt.logs:
            if log.address.lower() == self.usdc_address.lower():
                if log.topics[0].hex() == transfer_sig:
                    # Parse transfer event
                    from_addr = to_checksum_address("0x" + log.topics[1].hex()[26:])
                    to_addr = to_checksum_address("0x" + log.topics[2].hex()[26:])
                    amount = int(log.data, 16)
                    
                    return {
                        "from": from_addr,
                        "to": to_addr,
                        "amount": str(amount)
                    }
        
        return None
    
    async def validate_facilitator(self) -> bool:
        """Validate that facilitator is accessible"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.facilitator_url}/health")
                return response.status_code == 200
        except:
            return False
    
    async def get_usdc_balance(self, address: str) -> int:
        """Get USDC balance for an address"""
        try:
            checksum_addr = to_checksum_address(address)
            balance = self.usdc_contract.functions.balanceOf(checksum_addr).call()
            return balance
        except Exception as e:
            logger.error("Failed to get USDC balance", address=address, error=str(e))
            return 0

class PaymentCache:
    """Cache for verified payments to prevent double-spending"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.prefix = "payment_cache:"
        self.ttl = 86400  # 24 hours
    
    async def is_payment_used(self, tx_hash: str) -> bool:
        """Check if payment has already been used"""
        key = f"{self.prefix}{tx_hash}"
        result = await self.redis.get(key)
        return result is not None
    
    async def mark_payment_used(self, tx_hash: str, payment_proof: PaymentProof):
        """Mark payment as used"""
        key = f"{self.prefix}{tx_hash}"
        data = {
            "from_address": payment_proof.from_address,
            "amount": payment_proof.amount,
            "timestamp": payment_proof.timestamp.isoformat(),
            "used_at": datetime.utcnow().isoformat()
        }
        await self.redis.setex(key, self.ttl, json.dumps(data))
    
    async def get_payment_info(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached payment info"""
        key = f"{self.prefix}{tx_hash}"
        data = await self.redis.get(key)
        return json.loads(data) if data else None
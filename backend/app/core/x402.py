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
    
    def format_402_response(self, payment_req: PaymentRequirement, resource: str = "") -> Dict[str, Any]:
        """Format HTTP 402 Payment Required response per x402 v2 spec"""
        return {
            "x402Version": 2,
            "error": "Payment Required",
            "resource": {
                "url": resource,
                "description": payment_req.description,
                "mimeType": "application/json",
            },
            "accepts": [
                {
                    "scheme": "exact",
                    "network": "eip155:8453",  # Base mainnet in CAIP-2 format
                    "asset": str(self.usdc_address),
                    "amount": payment_req.amount,
                    "payTo": payment_req.to,
                    "maxTimeoutSeconds": 300,
                    "extra": {
                        "name": "USD Coin",
                        "version": "2",
                        "decimals": 6
                    }
                }
            ]
        }
    
    def parse_payment_header(self, payment_header: str) -> Dict[str, Any]:
        """Parse PAYMENT-SIGNATURE header from X402 v2 request (base64-encoded JSON)"""
        import base64 as _b64
        try:
            # x402 v2: base64-encoded PaymentPayload
            decoded = _b64.b64decode(payment_header + "==").decode()  # pad for safety
            data = json.loads(decoded)

            # Extract transaction hash from x402 v2 payload
            if "payload" in data:
                payload = data["payload"]
                tx_hash = payload.get("transaction") or payload.get("transaction_hash") or payload.get("txHash")
                chain_id = data.get("accepted", {}).get("network", "eip155:8453").split(":")[-1]
                return {
                    "transaction_hash": tx_hash,
                    "chain_id": int(chain_id) if chain_id.isdigit() else self.chain_id,
                    "raw": data
                }

            # Legacy JSON format
            if "transaction_hash" in data:
                return data

            raise ValueError("No transaction hash found in payment payload")

        except Exception as e:
            logger.error("Failed to parse payment header", error=str(e))
            raise ValueError(f"Invalid payment header format: {e}")
    
    async def verify_payment(
        self,
        payment_data: Dict[str, Any],
        expected_amount: str,
        expected_recipient: Optional[str] = None
    ) -> PaymentProof:
        """Verify x402 v2 payment via Coinbase facilitator (EIP-3009 authorization flow)"""

        raw = payment_data.get("raw")

        # x402 v2: forward raw PaymentPayload to facilitator /settle
        if raw:
            return await self._verify_via_facilitator(raw, expected_amount)

        # Legacy: direct blockchain tx lookup
        tx_hash = payment_data.get("transaction_hash")
        if not tx_hash:
            raise ValueError("Transaction hash required")
        return await self._verify_on_chain(tx_hash, expected_amount, expected_recipient)

    async def _verify_via_facilitator(
        self,
        payment_payload: Dict[str, Any],
        expected_amount: str
    ) -> PaymentProof:
        """Verify payment via Coinbase facilitator /settle or skip in dev mode"""
        from app.core.config import get_settings as _gs
        if _gs().SKIP_PAYMENT_VERIFY:
            logger.warning("SKIP_PAYMENT_VERIFY=true — skipping payment verification (dev mode)")
            return PaymentProof(
                transaction_hash="dev-skip",
                from_address="dev",
                to_address=self.payment_address,
                amount=expected_amount,
                currency="USDC",
                chain_id=self.chain_id,
                timestamp=datetime.utcnow(),
            )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.facilitator_url}/settle",
                    json=payment_payload,
                    headers={"Content-Type": "application/json"}
                )

            if resp.status_code not in (200, 201):
                logger.error("Facilitator settle failed", status=resp.status_code, body=resp.text)
                raise ValueError(f"Facilitator rejected payment: {resp.status_code} {resp.text}")

            result = resp.json()
            logger.info("Facilitator settled payment", result=result)

            return PaymentProof(
                transaction_hash=result.get("transaction", result.get("txHash", "facilitator-settled")),
                from_address=result.get("from", "unknown"),
                to_address=self.payment_address,
                amount=expected_amount,
                currency="USDC",
                chain_id=self.chain_id,
                timestamp=datetime.utcnow(),
            )

        except httpx.RequestError as e:
            raise ValueError(f"Facilitator unreachable: {e}")

    async def _verify_on_chain(
        self,
        tx_hash: str,
        expected_amount: str,
        expected_recipient: Optional[str] = None
    ) -> PaymentProof:
        """Verify payment by looking up the transaction on-chain"""
        try:
            tx_receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            tx = self.w3.eth.get_transaction(tx_hash)

            if tx_receipt.status != 1:
                raise ValueError("Transaction failed")

            if tx.to.lower() != self.usdc_address.lower():
                raise ValueError("Not a USDC transaction")

            transfer_data = self._parse_usdc_transfer(tx_receipt)
            if not transfer_data:
                raise ValueError("No USDC transfer found in transaction")

            recipient = expected_recipient or self.payment_address
            if transfer_data["to"].lower() != recipient.lower():
                raise ValueError(f"Payment sent to wrong address: {transfer_data['to']}")

            expected_amount_int = int(expected_amount)
            actual_amount_int = int(transfer_data["amount"])
            if actual_amount_int < expected_amount_int * 0.95:
                raise ValueError(
                    f"Insufficient payment: expected {expected_amount_int}, got {actual_amount_int}"
                )

            return PaymentProof(
                transaction_hash=tx_hash,
                from_address=transfer_data["from"],
                to_address=transfer_data["to"],
                amount=transfer_data["amount"],
                currency="USDC",
                chain_id=self.chain_id,
                timestamp=datetime.utcnow(),
                block_number=tx_receipt.blockNumber
            )

        except Exception as e:
            logger.error("On-chain payment verification failed", tx_hash=tx_hash, error=str(e))
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
"""X402 Payment Protocol Implementation"""

import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

import httpx
import structlog

_web3_mod = None
_eth_utils_mod = None

def _get_web3():
    global _web3_mod
    if _web3_mod is None:
        from web3 import Web3
        _web3_mod = Web3
    return _web3_mod

def _get_to_checksum_address():
    global _eth_utils_mod
    if _eth_utils_mod is None:
        from eth_utils import to_checksum_address
        _eth_utils_mod = to_checksum_address
    return _eth_utils_mod

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
    
    FACILITATOR_URLS = [
        "https://facilitator.xpay.sh",
        "https://x402.org/facilitator",
    ]

    def __init__(
        self, 
        payment_address: str,
        chain_id: int = 8453,  # Base
        facilitator_url: str = "https://facilitator.xpay.sh"
    ):
        self._payment_address = payment_address
        self.chain_id = chain_id
        self.facilitator_url = facilitator_url
        self.settings = get_settings()
        self._w3 = None
        self._usdc_contract = None
        
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

    @property
    def payment_address(self):
        return _get_to_checksum_address()(self._payment_address)

    @property
    def w3(self):
        if self._w3 is None:
            Web3 = _get_web3()
            if self.chain_id == 8453:
                self._w3 = Web3(Web3.HTTPProvider("https://mainnet.base.org"))
            else:
                self._w3 = Web3(Web3.HTTPProvider("https://eth-mainnet.alchemyapi.io/v2/your-key"))
        return self._w3

    @property
    def usdc_address(self):
        return _get_to_checksum_address()("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913")

    @property
    def usdc_contract(self):
        if self._usdc_contract is None:
            self._usdc_contract = self.w3.eth.contract(
                address=self.usdc_address,
                abi=self.usdc_abi
            )
        return self._usdc_contract
        
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
        """Parse X-Payment / PAYMENT-SIGNATURE header from X402 v2 request"""
        import base64 as _b64
        try:
            decoded = _b64.b64decode(payment_header + "==").decode()
            data = json.loads(decoded)

            tx_hash = None
            if "payload" in data:
                payload = data["payload"]
                tx_hash = payload.get("transaction") or payload.get("transaction_hash") or payload.get("txHash")
            elif "transaction_hash" in data:
                tx_hash = data["transaction_hash"]

            chain_id_str = data.get("accepted", {}).get("network", "eip155:8453").split(":")[-1]

            return {
                "transaction_hash": tx_hash,
                "chain_id": int(chain_id_str) if chain_id_str.isdigit() else self.chain_id,
                "raw": data,
                "raw_header": payment_header,
            }

        except Exception as e:
            logger.error("Failed to parse payment header", error=str(e))
            raise ValueError(f"Invalid payment header format: {e}")
    
    def _extract_tx_hash(self, payment_data: Dict[str, Any]) -> Optional[str]:
        """Extract transaction hash from any payment payload format"""
        tx = payment_data.get("transaction_hash")
        if tx:
            return tx

        raw = payment_data.get("raw", {})
        payload = raw.get("payload", {})
        for key in ("transaction", "transaction_hash", "txHash"):
            val = payload.get(key) or raw.get(key)
            if val and val.startswith("0x"):
                return val
        return None

    def build_payment_requirements(self, tier: str) -> Dict[str, Any]:
        """Build the paymentRequirements object that matches the 402 challenge we issued"""
        from app.core.config import get_pricing_config
        pricing = get_pricing_config()
        tier_config = pricing[tier]
        amount = str(int(tier_config["price"] * 1_000_000))

        return {
            "scheme": "exact",
            "network": f"eip155:{self.chain_id}",
            "asset": str(self.usdc_address),
            "amount": amount,
            "payTo": self.payment_address,
            "maxTimeoutSeconds": 300,
            "extra": {
                "name": "USD Coin",
                "version": "2",
                "decimals": 6,
            },
        }

    async def verify_payment(
        self,
        payment_data: Dict[str, Any],
        expected_amount: str,
        expected_recipient: Optional[str] = None,
        tier: Optional[str] = None,
    ) -> PaymentProof:
        """Verify x402 v2 payment — facilitator first, on-chain fallback"""

        raw_header = payment_data.get("raw_header")
        raw = payment_data.get("raw")

        if raw_header and tier:
            try:
                return await self._verify_via_facilitator(
                    raw_header, tier, expected_amount
                )
            except ValueError as e:
                if "unreachable" not in str(e).lower():
                    raise
                logger.warning("Facilitator unreachable, falling back to on-chain verification")
                tx_hash = self._extract_tx_hash(payment_data)
                if tx_hash:
                    return await self._verify_on_chain(tx_hash, expected_amount, expected_recipient)
                raise ValueError(
                    "Facilitator unreachable and no transaction hash in payload for on-chain fallback"
                )
        elif raw:
            try:
                return await self._verify_via_facilitator(
                    payment_data.get("raw_header", ""), tier, expected_amount
                )
            except Exception:
                tx_hash = self._extract_tx_hash(payment_data)
                if tx_hash:
                    return await self._verify_on_chain(tx_hash, expected_amount, expected_recipient)
                raise

        tx_hash = payment_data.get("transaction_hash")
        if not tx_hash:
            raise ValueError("Transaction hash required")
        return await self._verify_on_chain(tx_hash, expected_amount, expected_recipient)

    async def _verify_via_facilitator(
        self,
        raw_payment_header: str,
        tier: Optional[str],
        expected_amount: str,
    ) -> PaymentProof:
        """Verify payment via facilitator /settle with multi-URL fallback.

        X402 v2 facilitators expect:
        {
            "paymentPayload": "<base64 X-Payment header value>",
            "paymentRequirements": { <the accepts[0] object from the 402 challenge> }
        }
        """
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

        payment_requirements = self.build_payment_requirements(tier) if tier else {
            "scheme": "exact",
            "network": f"eip155:{self.chain_id}",
            "asset": str(self.usdc_address),
            "amount": expected_amount,
            "payTo": self.payment_address,
            "maxTimeoutSeconds": 300,
            "extra": {"name": "USD Coin", "version": "2", "decimals": 6},
        }

        facilitator_body = {
            "paymentPayload": raw_payment_header,
            "paymentRequirements": payment_requirements,
        }

        logger.info(
            "Sending to facilitator",
            has_payload=bool(raw_payment_header),
            requirements_amount=payment_requirements.get("amount"),
            requirements_payTo=payment_requirements.get("payTo"),
        )

        urls_to_try = [self.facilitator_url] + [
            u for u in self.FACILITATOR_URLS if u != self.facilitator_url
        ]
        last_error = None

        for url in urls_to_try:
            try:
                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    resp = await client.post(
                        f"{url}/settle",
                        json=facilitator_body,
                        headers={"Content-Type": "application/json"},
                    )

                if resp.status_code not in (200, 201):
                    logger.error("Facilitator settle failed", url=url, status=resp.status_code, body=resp.text)
                    raise ValueError(f"Facilitator rejected payment: {resp.status_code} {resp.text}")

                result = resp.json()

                settled_amount = (
                    result.get("amount")
                    or result.get("settledAmount")
                    or result.get("value")
                )
                if settled_amount is not None:
                    if int(settled_amount) < int(expected_amount):
                        raise ValueError(
                            f"Facilitator settled {settled_amount} but expected {expected_amount} — "
                            "possible tier mismatch attack"
                        )

                settled_to = result.get("to") or result.get("recipient")
                if settled_to and settled_to.lower() != self.payment_address.lower():
                    raise ValueError(
                        f"Facilitator settled to wrong address: {settled_to}"
                    )

                logger.info("Facilitator settled payment", url=url, tx=result.get("transaction") or result.get("txHash"))

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
                logger.warning("Facilitator unreachable, trying next", url=url, error=str(e))
                last_error = e
                continue

        raise ValueError(f"All facilitators unreachable: {last_error}")

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
            # H-2: strict equality — no underpayment tolerance
            if actual_amount_int < expected_amount_int:
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
                    from_addr = _get_to_checksum_address()("0x" + log.topics[1].hex()[26:])
                    to_addr = _get_to_checksum_address()("0x" + log.topics[2].hex()[26:])
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
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.facilitator_url}/health")
                return response.status_code == 200
        except Exception:
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
    """Permanent deduplication store for verified payments — backed by PostgreSQL.

    H-1: Redis TTL-based deduplication was vulnerable to replay after 24h.
    On-chain transactions are permanent; deduplication records must be too.
    """

    def __init__(self, db_pool):
        self.pool = db_pool.pool  # asyncpg pool

    async def is_payment_used(self, tx_hash: str) -> bool:
        """Check if payment has already been used"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT 1 FROM used_payments WHERE tx_hash = $1", tx_hash
            )
            return row is not None

    async def mark_payment_used(self, tx_hash: str, payment_proof: PaymentProof):
        """Permanently record payment as used — ON CONFLICT DO NOTHING is idempotent"""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """INSERT INTO used_payments
                       (tx_hash, from_address, to_address, amount, currency, chain_id)
                   VALUES ($1, $2, $3, $4, $5, $6)
                   ON CONFLICT (tx_hash) DO NOTHING""",
                tx_hash,
                payment_proof.from_address,
                payment_proof.to_address,
                payment_proof.amount,
                payment_proof.currency,
                payment_proof.chain_id,
            )

    async def get_payment_info(self, tx_hash: str) -> Optional[Dict[str, Any]]:
        """Get payment record"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM used_payments WHERE tx_hash = $1", tx_hash
            )
            return dict(row) if row else None
"""X402 payment protocol routes"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
import structlog

logger = structlog.get_logger()
router = APIRouter()


class PaymentVerificationRequest(BaseModel):
    """Verify an X402 payment"""
    
    transaction_hash: str
    amount: str
    from_address: str
    
    @validator("transaction_hash")
    def validate_tx_hash(cls, v):
        if not v.startswith("0x") or len(v) != 66:
            raise ValueError("Invalid transaction hash format")
        return v
    
    @validator("from_address")
    def validate_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("Invalid Ethereum address format")
        return v


class PaymentInfoResponse(BaseModel):
    """X402 payment information"""
    
    payment_address: str
    chain_id: int
    currency: str
    settlement_time_seconds: float
    support_url: str


@router.get("/info")
async def get_payment_info(request: Request) -> PaymentInfoResponse:
    """
    Get X402 payment information
    
    Returns payment details for integrating X402 into clients
    """
    
    x402_manager = request.app.state.x402_manager
    
    return PaymentInfoResponse(
        payment_address=x402_manager.payment_address,
        chain_id=8453,  # Base chain
        currency="USDC",
        settlement_time_seconds=2.0,
        support_url="https://github.com/funcdude/crypto-knowledge-api"
    )


@router.post("/verify")
async def verify_payment(
    request: Request,
    payment: PaymentVerificationRequest
) -> Dict[str, Any]:
    """
    Verify an X402 payment on the blockchain
    
    Validates that a payment was sent correctly and hasn't been double-spent.
    Used by clients to confirm payment before making API requests.
    """
    
    try:
        x402_manager = request.app.state.x402_manager
        
        # Verify payment on blockchain
        payment_proof = await x402_manager.verify_payment(
            payment_data={
                "transaction_hash": payment.transaction_hash,
                "amount": payment.amount,
                "from_address": payment.from_address
            },
            expected_amount=payment.amount
        )
        
        logger.info(
            "Payment verified",
            tx_hash=payment.transaction_hash,
            amount=payment.amount,
            from_address=payment.from_address
        )
        
        return {
            "verified": True,
            "transaction_hash": payment.transaction_hash,
            "amount": payment.amount,
            "currency": "USDC",
            "timestamp": payment_proof.timestamp if hasattr(payment_proof, 'timestamp') else None
        }
        
    except ValueError as e:
        logger.warning("Payment verification failed", error=str(e))
        raise HTTPException(
            status_code=400,
            detail={
                "verified": False,
                "error": "Payment verification failed",
                "message": str(e)
            }
        )
    except Exception as e:
        logger.error("Payment verification error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "verified": False,
                "error": "Payment verification error",
                "message": "Failed to verify payment on blockchain"
            }
        )


@router.get("/supported-chains")
async def get_supported_chains() -> Dict[str, Any]:
    """
    Get list of supported blockchain chains for X402 payments
    
    Currently supports Base L2 (Coinbase's L2 on Ethereum)
    """
    
    return {
        "supported_chains": [
            {
                "name": "Base",
                "chain_id": 8453,
                "currency": "USDC",
                "rpc_url": "https://mainnet.base.org",
                "block_time_seconds": 2
            }
        ],
        "default_chain": 8453
    }


@router.post("/create-requirement")
async def create_payment_requirement(
    request: Request,
    tier: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new X402 payment requirement
    
    Returns payment details that should be included in an X402 Payment Required (402) response
    """
    
    try:
        x402_manager = request.app.state.x402_manager
        
        payment_req = x402_manager.create_payment_requirement(
            tier=tier,
            description=description or f"Knowledge API access - {tier} tier",
            request_id=getattr(request.state, 'request_id', None)
        )
        
        return x402_manager.format_402_response(payment_req)
        
    except ValueError as e:
        logger.warning("Failed to create payment requirement", error=str(e))
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid payment requirement",
                "message": str(e)
            }
        )
    except Exception as e:
        logger.error("Payment requirement creation failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to create payment requirement",
                "message": "Internal server error"
            }
        )

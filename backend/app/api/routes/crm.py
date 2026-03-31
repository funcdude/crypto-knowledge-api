"""CRM sync — push consented emails to Simple CRM with 'sagemolly' tag"""

import time
import httpx
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
router = APIRouter()

_crm_token: str | None = None
_crm_token_expiry: float = 0


async def _get_crm_token() -> str:
    global _crm_token, _crm_token_expiry

    if _crm_token and time.time() < _crm_token_expiry - 300:
        return _crm_token

    settings = get_settings()
    if not settings.CRM_USERNAME or not settings.CRM_PASSWORD:
        raise HTTPException(status_code=503, detail="CRM not configured")

    async with httpx.AsyncClient(timeout=10, verify=False) as client:
        resp = await client.post(
            f"{settings.CRM_BASE_URL}/api/login",
            json={
                "email": settings.CRM_EMAIL,
                "password": settings.CRM_PASSWORD,
            },
        )
        if resp.status_code != 200:
            logger.error("CRM login failed", status=resp.status_code, body=resp.text[:200])
            raise HTTPException(status_code=502, detail="CRM authentication failed")

        data = resp.json()
        _crm_token = data["token"]
        _crm_token_expiry = time.time() + data.get("expires_in", 86400)
        return _crm_token


class CrmSyncRequest(BaseModel):
    email: EmailStr


@router.post("/crm-sync")
async def crm_sync(body: CrmSyncRequest, request: Request):
    settings = get_settings()
    email = body.email.strip().lower()

    token = await _get_crm_token()

    async with httpx.AsyncClient(timeout=10, verify=False) as client:
        resp = await client.post(
            f"{settings.CRM_BASE_URL}/api/contacts",
            json={"email": email, "tags": "sagemolly", "source": "api"},
            headers={"Authorization": f"Bearer {token}"},
        )

    if resp.status_code in (200, 201):
        data = resp.json()
        logger.info("CRM contact synced", email=email, created=data.get("created"), updated=data.get("updated"))
        return {"status": "ok", "created": data.get("created", False)}

    logger.error("CRM sync failed", status=resp.status_code, body=resp.text[:200])
    raise HTTPException(status_code=502, detail="Failed to sync with CRM")

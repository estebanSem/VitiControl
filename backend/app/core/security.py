from datetime import datetime, timezone

from fastapi import HTTPException, Request

from app.core.config import settings

sessions = {}
login_attempts = {}
ADMIN_USER = settings.admin_user


def authenticated(request: Request):
    token = request.cookies.get("viti_session", "")
    expiry = sessions.get(token)
    if not expiry or expiry < datetime.now(timezone.utc):
        sessions.pop(token, None)
        raise HTTPException(401, "Inicia sesión para continuar")
    return ADMIN_USER

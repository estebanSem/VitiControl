import hmac
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, Response

from app.core.config import settings
from app.core.security import login_attempts, sessions
from app.schemas import Login

ADMIN_USER = settings.admin_user
ADMIN_PASSWORD = settings.admin_password


def login(body: Login, response: Response, request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    attempts = [t for t in login_attempts.get(ip, []) if now - t < 60]
    if len(attempts) >= 10:
        raise HTTPException(429, "Demasiados intentos. Espera un minuto.")
    login_attempts[ip] = [*attempts, now]
    if not ADMIN_PASSWORD:
        raise HTTPException(503, "Configura ADMIN_PASSWORD en el servidor")
    if not (
        hmac.compare_digest(body.username, ADMIN_USER)
        and hmac.compare_digest(body.password, ADMIN_PASSWORD)
    ):
        raise HTTPException(401, "Usuario o contraseña incorrectos")
    token = secrets.token_urlsafe(32)
    sessions[token] = datetime.now(timezone.utc) + timedelta(hours=12)
    response.set_cookie(
        "viti_session",
        token,
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
        max_age=43200,
    )
    return {"username": ADMIN_USER}


def logout(request: Request, response: Response):
    sessions.pop(request.cookies.get("viti_session", ""), None)
    response.delete_cookie("viti_session")
    return {"ok": True}


def me():
    return {"username": ADMIN_USER}

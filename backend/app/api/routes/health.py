from fastapi import APIRouter

from app.core.database import engine

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    return {"status": "ok", "database": engine.dialect.name}

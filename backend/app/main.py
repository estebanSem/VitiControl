from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.static import mount_frontend
from app.services.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    settings.uploads.mkdir(parents=True, exist_ok=True)
    if settings.seed_demo:
        with SessionLocal() as session:
            seed(session)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="VitiControl API", version="1.0.0", lifespan=lifespan)
    app.include_router(api_router)
    mount_frontend(app)
    return app


app = create_app()

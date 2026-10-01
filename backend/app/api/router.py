from fastapi import APIRouter

from app.api.routes import auth, campaigns, export, health, parcels, photos, records

api_router = APIRouter()
for module in (health, auth, parcels, campaigns, records, photos, export):
    api_router.include_router(module.router)

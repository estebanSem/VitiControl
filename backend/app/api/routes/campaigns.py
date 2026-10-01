from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import db
from app.core.security import authenticated
from app.schemas import CampaignInput
from app.services import campaigns as service

router = APIRouter(tags=["campaigns"])


@router.get("/api/campaigns", dependencies=[Depends(authenticated)])
def campaigns(s: Session = Depends(db)):
    return service.campaigns(s=s)


@router.post("/api/campaigns", status_code=201, dependencies=[Depends(authenticated)])
def add_campaign(body: CampaignInput, s: Session = Depends(db)):
    return service.add_campaign(body=body, s=s)

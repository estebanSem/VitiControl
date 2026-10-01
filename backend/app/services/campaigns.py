from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Campaign
from app.schemas import CampaignInput
from app.services.serialization import serialize


def campaigns(s: Session):
    return [
        serialize(p) for p in s.scalars(select(Campaign).order_by(Campaign.year.desc()))
    ]


def add_campaign(body: CampaignInput, s: Session):
    if s.scalar(select(Campaign).where(Campaign.year == body.year)):
        raise HTTPException(409, "La campaña ya existe")
    p = Campaign(**body.model_dump())
    s.add(p)
    s.commit()
    s.refresh(p)
    return serialize(p)

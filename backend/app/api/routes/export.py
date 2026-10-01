from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import db
from app.core.security import authenticated
from app.services import export as service

router = APIRouter(tags=["export"])


@router.get("/api/export", dependencies=[Depends(authenticated)])
def export(campaign: int, s: Session = Depends(db)):
    return service.export(campaign=campaign, s=s)

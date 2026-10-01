from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import db
from app.core.security import authenticated
from app.schemas import RecordInput
from app.services import records as service

router = APIRouter(tags=["records"])


@router.get("/api/records", dependencies=[Depends(authenticated)])
def records(
    campaign: int | None = None, parcel_id: int | None = None, s: Session = Depends(db)
):
    return service.records(campaign=campaign, parcel_id=parcel_id, s=s)


@router.post("/api/records", status_code=201, dependencies=[Depends(authenticated)])
def add_record(body: RecordInput, s: Session = Depends(db)):
    return service.add_record(body=body, s=s)


@router.put("/api/records/{id}", dependencies=[Depends(authenticated)])
def edit_record(id: int, body: RecordInput, s: Session = Depends(db)):
    return service.edit_record(id=id, body=body, s=s)


@router.delete(
    "/api/records/{id}", status_code=204, dependencies=[Depends(authenticated)]
)
def delete_record(id: int, s: Session = Depends(db)):
    return service.delete_record(id=id, s=s)

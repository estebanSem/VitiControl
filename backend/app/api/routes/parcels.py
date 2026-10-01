from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import db
from app.core.security import authenticated
from app.schemas import ParcelInput
from app.services import parcels as service

router = APIRouter(tags=["parcels"])


@router.get("/api/parcels", dependencies=[Depends(authenticated)])
def parcels(s: Session = Depends(db)):
    return service.parcels(s=s)


@router.post("/api/parcels", status_code=201, dependencies=[Depends(authenticated)])
def add_parcel(body: ParcelInput, s: Session = Depends(db)):
    return service.add_parcel(body=body, s=s)


@router.put("/api/parcels/{id}", dependencies=[Depends(authenticated)])
def edit_parcel(id: int, body: ParcelInput, s: Session = Depends(db)):
    return service.edit_parcel(id=id, body=body, s=s)


@router.delete(
    "/api/parcels/{id}", status_code=204, dependencies=[Depends(authenticated)]
)
def delete_parcel(id: int, s: Session = Depends(db)):
    return service.delete_parcel(id=id, s=s)

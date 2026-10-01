from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import db
from app.core.security import authenticated
from app.services import photos as service

router = APIRouter(tags=["photos"])


@router.post(
    "/api/records/{id}/photos", status_code=201, dependencies=[Depends(authenticated)]
)
async def upload(id: int, file: UploadFile = File(...), s: Session = Depends(db)):
    return await service.upload(id=id, file=file, s=s)


@router.get("/api/records/{id}/photos", dependencies=[Depends(authenticated)])
def photos(id: int, s: Session = Depends(db)):
    return service.photos(id=id, s=s)


@router.get("/api/photos/{id}", dependencies=[Depends(authenticated)])
def photo(id: int, s: Session = Depends(db)):
    return service.photo(id=id, s=s)

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Campaign, Parcel, Photo, Record
from app.schemas import RecordInput
from app.services.serialization import serialize

UPLOADS = settings.uploads


def records(s: Session, campaign: int | None = None, parcel_id: int | None = None):
    q = select(Record).order_by(Record.date.desc(), Record.id.desc())
    if campaign:
        q = q.where(Record.campaign == campaign)
    if parcel_id:
        q = q.where(Record.parcel_id == parcel_id)
    return [serialize(p) for p in s.scalars(q)]


def validate_links(body, s):
    if not s.get(Parcel, body.parcel_id):
        raise HTTPException(422, "Parcela no encontrada")
    if not s.scalar(select(Campaign).where(Campaign.year == body.campaign)):
        raise HTTPException(422, "Campaña no encontrada")


def add_record(body: RecordInput, s: Session):
    validate_links(body, s)
    p = Record(**body.model_dump())
    s.add(p)
    s.commit()
    s.refresh(p)
    return serialize(p)


def edit_record(id: int, body: RecordInput, s: Session):
    p = s.get(Record, id)
    if not p:
        raise HTTPException(404, "Registro no encontrado")
    validate_links(body, s)
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    s.commit()
    return serialize(p)


def delete_record(id: int, s: Session):
    p = s.get(Record, id)
    if not p:
        raise HTTPException(404, "Registro no encontrado")
    for photo in s.scalars(select(Photo).where(Photo.record_id == id)):
        (UPLOADS / photo.filename).unlink(missing_ok=True)
        s.delete(photo)
    s.delete(p)
    s.commit()

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Parcel, Record
from app.schemas import ParcelInput
from app.services.serialization import serialize


def parcels(s: Session):
    return [serialize(p) for p in s.scalars(select(Parcel).order_by(Parcel.id))]


def add_parcel(body: ParcelInput, s: Session):
    p = Parcel(**body.model_dump())
    s.add(p)
    s.commit()
    s.refresh(p)
    return serialize(p)


def edit_parcel(id: int, body: ParcelInput, s: Session):
    p = s.get(Parcel, id)
    if not p:
        raise HTTPException(404, "Parcela no encontrada")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    s.commit()
    return serialize(p)


def delete_parcel(id: int, s: Session):
    p = s.get(Parcel, id)
    if not p:
        raise HTTPException(404, "Parcela no encontrada")
    if s.scalar(select(Record).where(Record.parcel_id == id)):
        raise HTTPException(
            409,
            "La parcela tiene registros. Conserva su histórico o elimina primero los registros.",
        )
    s.delete(p)
    s.commit()

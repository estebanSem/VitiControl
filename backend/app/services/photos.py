import secrets

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Photo, Record

UPLOADS = settings.uploads


async def upload(id: int, file: UploadFile, s: Session):
    if not s.get(Record, id):
        raise HTTPException(404, "Registro no encontrado")
    raw = await file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(413, "La fotografía no puede superar 5 MB")
    if raw.startswith(b"\xff\xd8\xff"):
        ext = "jpg"
        mime = "image/jpeg"
    elif raw.startswith(b"\x89PNG\r\n\x1a\n"):
        ext = "png"
        mime = "image/png"
    elif raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        ext = "webp"
        mime = "image/webp"
    else:
        raise HTTPException(415, "Utiliza una imagen JPEG, PNG o WebP")
    filename = secrets.token_hex(20) + "." + ext
    (UPLOADS / filename).write_bytes(raw)
    p = Photo(record_id=id, filename=filename, mime=mime)
    s.add(p)
    s.commit()
    s.refresh(p)
    return {"id": p.id, "url": f"/api/photos/{p.id}"}


def photos(id: int, s: Session):
    return [
        {"id": p.id, "url": f"/api/photos/{p.id}"}
        for p in s.scalars(select(Photo).where(Photo.record_id == id))
    ]


def photo(id: int, s: Session):
    p = s.get(Photo, id)
    if not p:
        raise HTTPException(404, "Fotografía no encontrada")
    return FileResponse(
        UPLOADS / p.filename,
        media_type=p.mime,
        headers={"X-Content-Type-Options": "nosniff"},
    )

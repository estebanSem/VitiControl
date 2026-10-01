from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Photo(Base):
    __tablename__ = "photos"
    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("records.id"))
    filename: Mapped[str] = mapped_column(String(100))
    mime: Mapped[str] = mapped_column(String(40))

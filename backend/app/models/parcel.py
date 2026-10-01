from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Parcel(Base):
    __tablename__ = "parcels"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    variety: Mapped[str] = mapped_column(String(100))
    area: Mapped[float] = mapped_column(Float)
    vines: Mapped[int] = mapped_column(Integer)
    planted: Mapped[int] = mapped_column(Integer)
    location: Mapped[str] = mapped_column(String(150), default="")
    notes: Mapped[str] = mapped_column(Text, default="")

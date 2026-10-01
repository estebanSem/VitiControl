from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Record(Base):
    __tablename__ = "records"
    id: Mapped[int] = mapped_column(primary_key=True)
    parcel_id: Mapped[int] = mapped_column(ForeignKey("parcels.id"))
    campaign: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(30))
    date: Mapped[date] = mapped_column(Date)
    title: Mapped[str] = mapped_column(String(150))
    notes: Mapped[str] = mapped_column(Text, default="")
    cost: Mapped[float] = mapped_column(Float, default=0)
    quantity: Mapped[float] = mapped_column(Float, default=0)
    brix: Mapped[float | None] = mapped_column(Float, nullable=True)
    product: Mapped[str] = mapped_column(String(150), default="")
    dose: Mapped[str] = mapped_column(String(100), default="")
    unit: Mapped[str] = mapped_column(String(30), default="")
    completed: Mapped[bool] = mapped_column(Boolean, default=True)

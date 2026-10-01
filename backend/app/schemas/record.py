from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class RecordInput(BaseModel):
    parcel_id: int
    campaign: int = Field(ge=1900, le=2100)
    kind: Literal[
        "Riego", "Tratamiento", "Poda", "Abonado", "Vendimia", "Incidencia", "Tarea"
    ]
    date: date
    title: str = Field(min_length=1, max_length=150)
    notes: str = Field(default="", max_length=5000)
    cost: float = Field(default=0, ge=0)
    quantity: float = Field(default=0, ge=0)
    brix: float | None = Field(default=None, ge=0, le=60)
    product: str = Field(default="", max_length=150)
    dose: str = Field(default="", max_length=100)
    unit: str = Field(default="", max_length=30)
    completed: bool = True

    @model_validator(mode="after")
    def check(self):
        if self.kind == "Tratamiento" and not self.product.strip():
            raise ValueError("Indica el producto del tratamiento")
        if self.kind == "Vendimia" and self.quantity <= 0:
            raise ValueError("Indica los kilos recogidos")
        return self

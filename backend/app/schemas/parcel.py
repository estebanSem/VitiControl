from pydantic import BaseModel, Field


class ParcelInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    variety: str = Field(min_length=1, max_length=100)
    area: float = Field(gt=0, le=100000)
    vines: int = Field(ge=0)
    planted: int = Field(ge=1800, le=2100)
    location: str = Field(default="", max_length=150)
    notes: str = Field(default="", max_length=5000)

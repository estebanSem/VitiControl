from pydantic import BaseModel, Field


class CampaignInput(BaseModel):
    year: int = Field(ge=1900, le=2100)
    name: str = Field(min_length=1, max_length=100)

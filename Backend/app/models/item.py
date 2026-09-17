from datetime import datetime, timezone
from typing import Optional, List
from pydantic import Field
from app.models.common import BaseMongoModel, PyObjectId


class ItemInDB(BaseMongoModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    description: Optional[str] = None
    price: float = 0.0
    tags: List[str] = Field(default_factory=list)
    is_published: bool = True
    featured: bool = False
    min_eligibility: Optional[str] = None
    company_name: Optional[str] = None
    company_website: Optional[str] = None
    company_address: Optional[str] = None
    company_tax_id: Optional[str] = None
    owner_id: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

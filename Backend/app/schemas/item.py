from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.common import PyObjectId


class ItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    price: float = Field(0.0, ge=0)
    tags: List[str] = Field(default_factory=list)
    is_published: bool = True
    featured: bool = False
    min_eligibility: Optional[str] = Field(None, max_length=80)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_address: Optional[str] = Field(None, max_length=500)
    company_tax_id: Optional[str] = Field(None, max_length=100)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None
    featured: Optional[bool] = None
    min_eligibility: Optional[str] = Field(None, max_length=80)
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    company_website: Optional[str] = Field(None, max_length=500)
    company_address: Optional[str] = Field(None, max_length=500)
    company_tax_id: Optional[str] = Field(None, max_length=100)


class ItemOut(ItemBase):
    id: PyObjectId = Field(alias="_id")
    owner_id: PyObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class PaginatedItems(BaseModel):
    items: List[ItemOut]
    total: int
    page: int
    size: int
    pages: int

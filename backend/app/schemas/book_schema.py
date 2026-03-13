from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class BookCreate(BaseModel):
    country: str
    city: str
    subtitle: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class BookUpdate(BaseModel):
    country: Optional[str] = None
    city: Optional[str] = None
    subtitle: Optional[str] = None
    cover_url: Optional[str] = None
    intro: Optional[str] = None
    epilogue: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    spine_color: Optional[str] = None
    order: Optional[int] = None


class BookResponse(BaseModel):
    id: int
    country: str
    city: str
    subtitle: Optional[str] = None
    cover_url: Optional[str] = None
    intro: Optional[str] = None
    epilogue: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    spine_color: str
    order: int
    pages_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

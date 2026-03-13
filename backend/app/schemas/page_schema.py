from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel


class PageCreate(BaseModel):
    book_id: int
    caption: Optional[str] = None
    layout: str = "A"
    filter: str = "original"
    song_data: Optional[Any] = None
    coordinates: Optional[Any] = None
    order: int = 0


class PageUpdate(BaseModel):
    caption: Optional[str] = None
    photo_url: Optional[str] = None
    photo_thumb_url: Optional[str] = None
    layout: Optional[str] = None
    filter: Optional[str] = None
    song_data: Optional[Any] = None
    coordinates: Optional[Any] = None
    order: Optional[int] = None


class PageResponse(BaseModel):
    id: int
    book_id: int
    photo_url: Optional[str] = None
    photo_thumb_url: Optional[str] = None
    caption: Optional[str] = None
    layout: str
    filter: str
    song_data: Optional[Any] = None
    coordinates: Optional[Any] = None
    order: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

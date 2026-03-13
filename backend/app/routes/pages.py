from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.database import get_db
from app.models.page import Page
from app.schemas.page_schema import PageCreate, PageUpdate
from app.services.storage_service import upload_image

router = APIRouter()


def page_to_response(page: Page) -> dict:
    return {
        "id": page.id,
        "book_id": page.book_id,
        "photo_url": page.photo_url,
        "photo_thumb_url": page.photo_thumb_url,
        "caption": page.caption,
        "layout": page.layout,
        "filter": page.filter,
        "song_data": page.song_data,
        "coordinates": page.coordinates,
        "order": page.order,
        "created_at": page.created_at,
    }


@router.get("/")
def list_pages(book_id: int, db: Session = Depends(get_db)):
    pages = (
        db.query(Page)
        .filter(Page.book_id == book_id)
        .order_by(Page.order)
        .all()
    )
    return [page_to_response(p) for p in pages]


@router.post("/", status_code=201)
async def create_page(
    book_id: int = Form(...),
    caption: Optional[str] = Form(None),
    layout: str = Form("A"),
    filter: str = Form("original"),
    order: int = Form(0),
    photo: Optional[UploadFile] = File(None),
    photo_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    page = Page(
        book_id=book_id,
        caption=caption,
        layout=layout,
        filter=filter,
        order=order,
    )

    if photo:
        file_bytes = await photo.read()
        url, thumb_url = upload_image(file_bytes, photo.filename or "photo.jpg")
        page.photo_url = url
        page.photo_thumb_url = thumb_url
    elif photo_url:
        page.photo_url = photo_url

    db.add(page)
    db.commit()
    db.refresh(page)
    return page_to_response(page)


@router.post("/json", status_code=201)
def create_page_json(data: PageCreate, db: Session = Depends(get_db)):
    page = Page(
        book_id=data.book_id,
        caption=data.caption,
        layout=data.layout,
        filter=data.filter,
        order=data.order,
    )
    page.song_data = data.song_data
    page.coordinates = data.coordinates

    db.add(page)
    db.commit()
    db.refresh(page)
    return page_to_response(page)


@router.get("/{page_id}")
def get_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page_to_response(page)


@router.put("/{page_id}")
def update_page(page_id: int, data: PageUpdate, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key in ("song_data", "coordinates"):
            setattr(page, key, value)
        else:
            setattr(page, key, value)

    db.commit()
    db.refresh(page)
    return page_to_response(page)


@router.delete("/{page_id}")
def delete_page(page_id: int, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    db.delete(page)
    db.commit()
    return {"message": "Page deleted"}


class ReorderRequest(BaseModel):
    order: List[int]


@router.patch("/reorder")
def reorder_pages(data: ReorderRequest, db: Session = Depends(get_db)):
    for idx, page_id in enumerate(data.order):
        page = db.query(Page).filter(Page.id == page_id).first()
        if page:
            page.order = idx
    db.commit()
    return {"message": "Pages reordered"}

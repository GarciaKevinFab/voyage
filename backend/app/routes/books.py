import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.database import get_db
from app.models.book import Book
from app.models.page import Page
from app.schemas.book_schema import BookCreate, BookUpdate, BookResponse

router = APIRouter()

SPINE_COLORS = ["#C9A96E", "#8B4513", "#2F4F4F", "#800020", "#1B3F5C"]


def book_to_response(book: Book) -> dict:
    return {
        "id": book.id,
        "country": book.country,
        "city": book.city,
        "subtitle": book.subtitle,
        "cover_url": book.cover_url,
        "intro": book.intro,
        "epilogue": book.epilogue,
        "start_date": book.start_date,
        "end_date": book.end_date,
        "spine_color": book.spine_color,
        "order": book.order,
        "pages_count": len(book.pages) if book.pages else 0,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
    }


@router.get("/")
def list_books(db: Session = Depends(get_db)):
    books = db.query(Book).order_by(Book.order).all()
    return [book_to_response(b) for b in books]


@router.post("/", status_code=201)
def create_book(data: BookCreate, db: Session = Depends(get_db)):
    # Auto-assign spine color
    count = db.query(Book).count()
    spine_color = SPINE_COLORS[count % len(SPINE_COLORS)]

    # Auto-assign order
    max_order = db.query(Book).count()

    book = Book(
        country=data.country,
        city=data.city,
        subtitle=data.subtitle,
        start_date=data.start_date,
        end_date=data.end_date,
        spine_color=spine_color,
        order=max_order,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book_to_response(book)


@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    result = book_to_response(book)
    # Include pages
    pages = []
    for p in sorted(book.pages, key=lambda x: x.order):
        pages.append(
            {
                "id": p.id,
                "book_id": p.book_id,
                "photo_url": p.photo_url,
                "photo_thumb_url": p.photo_thumb_url,
                "caption": p.caption,
                "layout": p.layout,
                "filter": p.filter,
                "song_data": p.song_data,
                "coordinates": p.coordinates,
                "order": p.order,
                "created_at": p.created_at,
            }
        )
    result["pages"] = pages
    return result


@router.put("/{book_id}")
def update_book(book_id: int, data: BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(book, key, value)

    db.commit()
    db.refresh(book)
    return book_to_response(book)


@router.delete("/{book_id}")
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(book)
    db.commit()
    return {"message": "Book deleted"}


class ReorderRequest(BaseModel):
    order: List[int]


@router.patch("/reorder")
def reorder_books(data: ReorderRequest, db: Session = Depends(get_db)):
    for idx, book_id in enumerate(data.order):
        book = db.query(Book).filter(Book.id == book_id).first()
        if book:
            book.order = idx
    db.commit()
    return {"message": "Books reordered"}


@router.get("/{book_id}/export")
def export_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    pages_data = []
    for p in sorted(book.pages, key=lambda x: x.order):
        pages_data.append(
            {
                "photo_url": p.photo_url,
                "photo_thumb_url": p.photo_thumb_url,
                "caption": p.caption,
                "layout": p.layout,
                "filter": p.filter,
                "song_data": p.song_data,
                "coordinates": p.coordinates,
                "order": p.order,
            }
        )

    return {
        "format": "assouline",
        "version": "1.0",
        "book": {
            "country": book.country,
            "city": book.city,
            "subtitle": book.subtitle,
            "cover_url": book.cover_url,
            "intro": book.intro,
            "epilogue": book.epilogue,
            "start_date": book.start_date,
            "end_date": book.end_date,
            "spine_color": book.spine_color,
        },
        "pages": pages_data,
    }


class ImportRequest(BaseModel):
    data: dict


@router.post("/import")
def import_book(request: ImportRequest, db: Session = Depends(get_db)):
    import_data = request.data

    book_data = import_data.get("book", {})
    pages_data = import_data.get("pages", [])

    # Auto-assign spine color and order
    count = db.query(Book).count()

    book = Book(
        country=book_data.get("country", "Unknown"),
        city=book_data.get("city", "Unknown"),
        subtitle=book_data.get("subtitle"),
        cover_url=book_data.get("cover_url"),
        intro=book_data.get("intro"),
        epilogue=book_data.get("epilogue"),
        start_date=book_data.get("start_date"),
        end_date=book_data.get("end_date"),
        spine_color=book_data.get("spine_color", SPINE_COLORS[count % len(SPINE_COLORS)]),
        order=count,
    )
    db.add(book)
    db.flush()

    for page_data in pages_data:
        page = Page(book_id=book.id)
        page.photo_url = page_data.get("photo_url")
        page.photo_thumb_url = page_data.get("photo_thumb_url")
        page.caption = page_data.get("caption")
        page.layout = page_data.get("layout", "A")
        page.filter = page_data.get("filter", "original")
        page.song_data = page_data.get("song_data")
        page.coordinates = page_data.get("coordinates")
        page.order = page_data.get("order", 0)
        db.add(page)

    db.commit()
    db.refresh(book)
    return book_to_response(book)

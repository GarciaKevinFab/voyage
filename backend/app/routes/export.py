from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import io

from app.models.database import get_db
from app.models.book import Book
from app.services.pdf_service import generate_pdf

router = APIRouter()


class ExportPDFRequest(BaseModel):
    book_id: int


@router.post("/pdf")
def export_pdf(data: ExportPDFRequest, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == data.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    pages = sorted(book.pages, key=lambda p: p.order)

    try:
        pdf_bytes = generate_pdf(book, pages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = f"voyage_{book.city}_{book.country}.pdf".replace(" ", "_").lower()

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

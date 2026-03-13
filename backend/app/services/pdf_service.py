import io
import base64
import textwrap
from typing import List

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image as RLImage,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY


def generate_pdf(book, pages) -> bytes:
    """Generate a PDF for a book with its pages. Returns PDF bytes."""
    buffer = io.BytesIO()
    page_width, page_height = landscape(A4)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "BookTitle",
        parent=styles["Title"],
        fontSize=36,
        leading=44,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=HexColor(book.spine_color or "#C9A96E"),
    )

    subtitle_style = ParagraphStyle(
        "BookSubtitle",
        parent=styles["Normal"],
        fontSize=16,
        leading=22,
        alignment=TA_CENTER,
        textColor=HexColor("#666666"),
        spaceAfter=30,
    )

    body_style = ParagraphStyle(
        "BookBody",
        parent=styles["Normal"],
        fontSize=12,
        leading=18,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        textColor=black,
    )

    caption_style = ParagraphStyle(
        "Caption",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=HexColor("#555555"),
        fontName="Helvetica-Oblique",
        spaceBefore=8,
    )

    section_title_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Normal"],
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=HexColor(book.spine_color or "#C9A96E"),
        fontName="Helvetica-Bold",
        spaceAfter=20,
    )

    elements = []

    # --- Cover Page ---
    elements.append(Spacer(1, 3 * cm))
    title_text = f"{book.city}"
    elements.append(Paragraph(title_text, title_style))

    country_style = ParagraphStyle(
        "Country",
        parent=subtitle_style,
        fontSize=20,
        textColor=HexColor("#999999"),
    )
    elements.append(Paragraph(book.country.upper(), country_style))

    if book.subtitle:
        elements.append(Paragraph(book.subtitle, subtitle_style))

    if book.start_date and book.end_date:
        date_text = f"{book.start_date} &mdash; {book.end_date}"
        elements.append(Spacer(1, 1 * cm))
        elements.append(Paragraph(date_text, subtitle_style))

    elements.append(PageBreak())

    # --- Intro Page ---
    if book.intro:
        elements.append(Spacer(1, 2 * cm))
        elements.append(Paragraph("Introduction", section_title_style))
        # Split intro into paragraphs
        for para in book.intro.split("\n"):
            para = para.strip()
            if para:
                elements.append(Paragraph(para, body_style))
        elements.append(PageBreak())

    # --- Photo Pages ---
    for page in pages:
        has_content = False

        # Try to add photo
        if page.photo_url and not page.photo_url.startswith("data:"):
            # Only handle non-base64 URLs (external images)
            try:
                import httpx

                resp = httpx.get(page.photo_url, timeout=10, follow_redirects=True)
                if resp.status_code == 200:
                    img_buffer = io.BytesIO(resp.content)
                    max_w = page_width - 4 * cm
                    max_h = page_height - 6 * cm
                    img = RLImage(img_buffer, width=max_w, height=max_h)
                    img.hAlign = "CENTER"
                    elements.append(Spacer(1, 0.5 * cm))
                    elements.append(img)
                    has_content = True
            except Exception:
                pass
        elif page.photo_url and page.photo_url.startswith("data:"):
            # Base64 image
            try:
                header, data = page.photo_url.split(",", 1)
                img_bytes = base64.b64decode(data)
                img_buffer = io.BytesIO(img_bytes)
                max_w = page_width - 4 * cm
                max_h = page_height - 6 * cm
                img = RLImage(img_buffer, width=max_w, height=max_h)
                img.hAlign = "CENTER"
                elements.append(Spacer(1, 0.5 * cm))
                elements.append(img)
                has_content = True
            except Exception:
                pass

        # Caption
        if page.caption:
            if not has_content:
                elements.append(Spacer(1, 2 * cm))
            elements.append(Paragraph(page.caption, caption_style))
            has_content = True

        if has_content:
            elements.append(PageBreak())

    # --- Epilogue Page ---
    if book.epilogue:
        elements.append(Spacer(1, 2 * cm))
        elements.append(Paragraph("Epilogue", section_title_style))
        for para in book.epilogue.split("\n"):
            para = para.strip()
            if para:
                elements.append(Paragraph(para, body_style))

    # Build PDF
    if not elements:
        elements.append(Paragraph("Empty Book", title_style))

    doc.build(elements)
    return buffer.getvalue()

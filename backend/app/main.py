from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.database import engine, Base
from app.routes import claude, music, cover, books, pages, export

app = FastAPI(
    title="VOYAGE API",
    description="Backend for luxury travel photo album creator",
    version="1.0.0",
)

# CORS - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(claude.router, prefix="/api/claude", tags=["Claude AI"])
app.include_router(music.router, prefix="/api/music", tags=["Music"])
app.include_router(cover.router, prefix="/api/cover", tags=["Cover"])
app.include_router(books.router, prefix="/api/books", tags=["Books"])
app.include_router(pages.router, prefix="/api/pages", tags=["Pages"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])


@app.on_event("startup")
def on_startup():
    # Import models so they register with Base
    from app.models import book, page  # noqa: F401

    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": "voyage-api"}


@app.get("/")
def root():
    return {
        "name": "VOYAGE API",
        "version": "1.0.0",
        "docs": "/docs",
    }

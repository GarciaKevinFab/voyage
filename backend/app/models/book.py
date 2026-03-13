from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.models.database import Base


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country = Column(String, nullable=False)
    city = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    intro = Column(Text, nullable=True)
    epilogue = Column(Text, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    spine_color = Column(String, default="#C9A96E")
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pages = relationship("Page", back_populates="book", cascade="all, delete-orphan")

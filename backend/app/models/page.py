import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.database import Base


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    photo_url = Column(String, nullable=True)
    photo_thumb_url = Column(String, nullable=True)
    caption = Column(Text, nullable=True)
    layout = Column(String, default="A")
    filter = Column(String, default="original")
    _song_data = Column("song_data", Text, nullable=True)
    _coordinates = Column("coordinates", Text, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    book = relationship("Book", back_populates="pages")

    @property
    def song_data(self):
        if self._song_data:
            try:
                return json.loads(self._song_data)
            except (json.JSONDecodeError, TypeError):
                return None
        return None

    @song_data.setter
    def song_data(self, value):
        if value is not None:
            self._song_data = json.dumps(value)
        else:
            self._song_data = None

    @property
    def coordinates(self):
        if self._coordinates:
            try:
                return json.loads(self._coordinates)
            except (json.JSONDecodeError, TypeError):
                return None
        return None

    @coordinates.setter
    def coordinates(self, value):
        if value is not None:
            self._coordinates = json.dumps(value)
        else:
            self._coordinates = None

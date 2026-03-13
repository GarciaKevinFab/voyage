import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./voyage.db")
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")
    UNSPLASH_ACCESS_KEY: str = os.getenv("UNSPLASH_ACCESS_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))


settings = Settings()

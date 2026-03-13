from fastapi import APIRouter
from app.services.cover_service import get_cover

router = APIRouter()


@router.get("/{city}/{country}")
async def get_cover_image(city: str, country: str):
    result = await get_cover(city, country)
    return result

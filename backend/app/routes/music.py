from fastapi import APIRouter, Query
from app.services.music_service import search_tracks

router = APIRouter()


@router.get("/search")
async def search_music(q: str = Query(..., min_length=1), limit: int = Query(8, ge=1, le=25)):
    tracks = await search_tracks(q, limit)
    return {"tracks": tracks}

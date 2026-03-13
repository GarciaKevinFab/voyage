import httpx
from typing import Dict, Optional
from app.config import settings


async def get_cover(city: str, country: str) -> Dict[str, Optional[str]]:
    """Get a cover image URL for a city/country from Unsplash or fallback."""
    if settings.UNSPLASH_ACCESS_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.unsplash.com/search/photos",
                    params={
                        "query": f"{city} {country} travel",
                        "per_page": 1,
                        "orientation": "landscape",
                    },
                    headers={
                        "Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"
                    },
                )
                response.raise_for_status()
                data = response.json()

            results = data.get("results", [])
            if results:
                photo = results[0]
                return {
                    "url": photo["urls"]["regular"],
                    "photographer": photo["user"]["name"],
                }
        except Exception as e:
            print(f"Unsplash API error: {e}")

    # Fallback
    return {
        "url": f"https://source.unsplash.com/1600x900/?{city},{country},travel",
        "photographer": None,
    }

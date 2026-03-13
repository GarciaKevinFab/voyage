import httpx
from typing import List, Dict, Any


async def search_tracks(query: str, limit: int = 8) -> List[Dict[str, Any]]:
    """Search for tracks using the iTunes Search API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://itunes.apple.com/search",
                params={
                    "term": query,
                    "media": "music",
                    "limit": limit,
                    "entity": "song",
                },
            )
            response.raise_for_status()
            data = response.json()

        results = []
        for track in data.get("results", []):
            artwork_url = track.get("artworkUrl100", "")
            if artwork_url:
                artwork_url = artwork_url.replace("100x100", "300x300")

            results.append(
                {
                    "trackName": track.get("trackName", ""),
                    "artistName": track.get("artistName", ""),
                    "previewUrl": track.get("previewUrl", ""),
                    "artworkUrl100": artwork_url,
                    "trackViewUrl": track.get("trackViewUrl", ""),
                    "collectionName": track.get("collectionName", ""),
                    "trackTimeMillis": track.get("trackTimeMillis", 0),
                }
            )

        return results

    except Exception as e:
        print(f"iTunes API error: {e}")
        return []

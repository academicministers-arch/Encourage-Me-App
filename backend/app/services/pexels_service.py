import httpx

from app.config import settings

PEXELS_BASE_URL = "https://api.pexels.com/v1/search"
DEFAULT_PER_PAGE = 12


def _normalize_photo(photo: dict) -> dict:
    src = photo.get('src', {})
    return {
        'id': photo.get('id'),
        'width': photo.get('width'),
        'height': photo.get('height'),
        'photographer': photo.get('photographer'),
        'photographer_url': photo.get('photographer_url'),
        'page_url': photo.get('url'),
        'src': src.get('large2x') or src.get('large') or src.get('medium') or src.get('original'),
        'thumbnail': src.get('medium') or src.get('small') or src.get('portrait') or src.get('original'),
        'alt': photo.get('alt') or 'Pexels theme background',
    }


async def search_pexels(query: str, page: int = 1, per_page: int = DEFAULT_PER_PAGE) -> list[dict]:
    if not settings.PEXELS_API_KEY:
        return []

    headers = {
        'Authorization': settings.PEXELS_API_KEY,
    }
    params = {
        'query': query,
        'per_page': per_page,
        'page': page,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(PEXELS_BASE_URL, headers=headers, params=params)
        except httpx.RequestError:
            return []

        if response.status_code != 200:
            return []

        data = response.json()
        photos = data.get('photos', []) or []
        return [_normalize_photo(photo) for photo in photos]

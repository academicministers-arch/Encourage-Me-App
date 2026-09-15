from fastapi import APIRouter, Depends, Query

from app import auth
from app.services.pexels_service import search_pexels
import app.models as models

router = APIRouter(prefix="/api/themes", tags=["themes"])


@router.get("/search")
async def search_themes(
    query: str = Query(..., min_length=3),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=24),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Search Pexels for theme backgrounds based on the user query."""
    results = await search_pexels(query, page=page, per_page=per_page)
    return {"themes": results}

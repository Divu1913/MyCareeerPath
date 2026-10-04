"""Job recommendation endpoint.

`POST /api/v1/recommendations/jobs` accepts a candidate's skills and
optional preferred roles, scores published items against explicit job
skill tags, and returns the top-N matches in descending score order.

Scoring model (kept simple and transparent):
- Build a normalized skill set (lowercased, trimmed, non-empty) from the
  request.
- Pull every published item from MongoDB (capped at a sane upper bound
  so a runaway query can't OOM the worker — adjust `MAX_CANDIDATE_ITEMS`
  if you have more items than that).
- For each item, compare normalized candidate skills to the job's `tags`
  (the required skills supplied by recruiters). The score is
  `matched / len(skills)` in [0, 1].
- If `preferred_roles` is set, an item must contain at least one of
  those role keywords in the haystack to be considered. This is a
  filter, not a scorer — a job in the wrong domain shouldn't sneak in
  just because the candidate happens to know Python.
- Items with zero matched skills are dropped.
- Ties are broken by `created_at` (newest first) so the ordering is
  stable.
"""
import logging
import re
from datetime import datetime
from typing import Iterable, List, Optional, Set, Tuple

from bson import ObjectId
from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api import deps
from app.crud.item import crud_item
from app.models.user import UserInDB
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    ScoredJob,
)
from app.schemas.item import ItemOut

logger = logging.getLogger(__name__)

router = APIRouter()

# Safety cap for the raw candidate-item pull. If you grow the corpus
# past this, swap the in-Python scoring for a Mongo aggregation or a
# dedicated vector store.
MAX_CANDIDATE_ITEMS = 5_000


def _normalize(values: Optional[Iterable[str]]) -> List[str]:
    """Lowercase, strip, and de-dup a list of free-form strings. Returns
    a list (not a set) so the original ordering is preserved for
    debugging and stable JSON output."""
    if not values:
        return []
    # Older job documents may store a comma-separated string, and legacy
    # records can contain non-string entries. Normalize those safely rather
    # than letting one malformed record fail the entire recommendation call.
    if isinstance(values, str):
        values = values.split(",")
    seen: Set[str] = set()
    out: List[str] = []
    for raw in values:
        if not isinstance(raw, str) or not raw:
            continue
        norm = re.sub(r"[^a-z0-9]+", "", raw.strip().lower())
        if not norm:
            continue
        if norm in seen:
            continue
        seen.add(norm)
        out.append(norm)
    return out


def _created_at_timestamp(value: object) -> float:
    """Return a sortable timestamp, treating missing/invalid dates as oldest.

    ``datetime.min.timestamp()`` can raise on some platforms. Items without a
    creation date use that sentinel below, so convert defensively before sort.
    """
    if not isinstance(value, datetime):
        return 0.0
    try:
        return value.timestamp()
    except (OverflowError, OSError, ValueError):
        return 0.0


def _score_item(
    item: dict,
    skills: List[str],
    preferred_roles: List[str],
) -> Tuple[float, List[str]]:
    """Return (score, matched_skills) for a single item. Score is in
    [0, 1]. Returns (0.0, []) if the item is filtered out or has no
    skill overlap."""
    # Recruiters enter required skills as comma-separated tags when posting
    # jobs. Match against those explicit tags (plus legacy `skills` arrays),
    # not arbitrary words in the title or description.
    job_skills = set(_normalize(item.get("tags"))) | set(_normalize(item.get("skills")))

    if preferred_roles:
        role_text = " ".join(
            part for part in (item.get("title"), item.get("description"))
            if isinstance(part, str)
        ).lower()
        role_hit = any(role in role_text for role in preferred_roles)
        if not role_hit:
            return 0.0, []

    matched: List[str] = []
    for skill in skills:
        if skill in job_skills:
            matched.append(skill)

    if not skills:
        # No skills provided → we have no basis to rank. Treat the item
        # as unmatchable rather than scoring everything as 1.0.
        return 0.0, []

    return len(matched) / len(skills), matched


@router.post(
    "/jobs",
    response_model=RecommendationResponse,
    status_code=status.HTTP_200_OK,
)
async def recommend_jobs(
    payload: RecommendationRequest,
    # `db` is injected even though we only use it to read the raw
    # `items` collection — keeps the dependency contract identical to
    # the other endpoints and makes the route trivial to mock in tests.
    db: AsyncIOMotorDatabase = Depends(deps.get_db),
    current_user: UserInDB = Depends(deps.get_current_active_user),
):
    """Rank published jobs by skill overlap with the candidate.

    The endpoint requires an authenticated active user. It does not
    personalize by user history (yet) — it's a stateless, request-
    driven ranking service.
    """
    skills = _normalize(payload.skills)
    preferred_roles = _normalize(payload.preferred_roles)
    limit = payload.limit

    if not skills and not preferred_roles:
        # Nothing to match against. Return an empty result rather than
        # every published job in arbitrary order.
        return RecommendationResponse(recommendations=[], total=0)

    cursor = (
        db["items"]
        .find({"is_published": True})
        .sort("created_at", -1)
        .limit(MAX_CANDIDATE_ITEMS)
    )
    items = await cursor.to_list(length=MAX_CANDIDATE_ITEMS)

    if not items:
        return RecommendationResponse(recommendations=[], total=0)

    scored: List[Tuple[float, datetime, dict, List[str]]] = []
    for item in items:
        score, matched = _score_item(item, skills, preferred_roles)
        if score <= 0:
            continue
        created_at = item.get("created_at") or datetime.min
        scored.append((score, created_at, item, matched))

    # Highest score first; ties broken by newest created_at.
    scored.sort(key=lambda row: (-row[0], -_created_at_timestamp(row[1])))

    top = scored[:limit]

    # Re-hydrate via CRUD so we get a fully validated ItemOut (handles
    # the PyObjectId alias dance and any future schema migrations in
    # one place). CRUD is per-document, so this loop is the price of
    # using the same validation path as the rest of the API.
    out: List[ScoredJob] = []
    for score, _created_at, raw_item, matched in top:
        item_id = raw_item.get("_id")
        if not isinstance(item_id, ObjectId):
            continue
        try:
            job = await crud_item.get(db, id=str(item_id))
        except Exception:  # pragma: no cover — defensive, schema drift
            logger.exception("Failed to hydrate item %s for recommendation", item_id)
            continue
        if job is None:
            continue
        out.append(ScoredJob(job=job, score=round(score, 4), matched_skills=matched))

    return RecommendationResponse(recommendations=out, total=len(out))

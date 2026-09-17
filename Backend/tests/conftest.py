"""Test fixtures: stub out MongoDB so the suite runs without a live Atlas.

The auth tests exercise the FastAPI app via httpx's legacy ``AsyncClient(app=...)``
shortcut. That shortcut does NOT run the FastAPI lifespan, so by default
``app.db.mongodb.db_instance.db`` is ``None`` and every Mongo-bound endpoint
raises ``RuntimeError("Database is not initialized.")``.

We solve that without touching the test file by:

1. Building a ``mongomock_motor`` client and assigning it to ``db_instance`` so
   ``get_database()`` returns a working, in-memory ``AsyncIOMotorDatabase``.
2. Patching ``connect_to_mongo``, ``close_mongo_connection``, and
   ``init_db_indexes`` so a real Atlas connection is never attempted — even if
   some future change re-introduces a lifespan invocation.
3. Resetting the in-memory state between tests so cross-test data does not leak.

The ``mongomock_motor`` package implements the Motor async surface we touch
(``insert_one``, ``find_one``, ``find().sort().limit().to_list()``,
``update_one`` with ``modified_count``, ``create_index``), which is everything
``crud_user`` and ``crud_otp`` call.
"""
from __future__ import annotations

import pytest
from mongomock_motor import AsyncMongoMockClient

from app.core.config import settings
from app.db import mongodb


@pytest.fixture(autouse=True)
def _stub_mongo(monkeypatch: pytest.MonkeyPatch):
    """Replace the real MongoDB client with a mongomock-motor instance for the
    duration of a single test, then reset state on teardown so tests are
    isolated."""
    mock_client = AsyncMongoMockClient()
    mock_db = mock_client[settings.DATABASE_NAME]

    # Swap the module-level db_instance with one that has a populated client/db.
    mongodb.db_instance.client = mock_client
    mongodb.db_instance.db = mock_db

    # Defensive: if the lifespan ever does run (e.g. someone wraps the test in
    # a TestClient later), these no-ops prevent any real Atlas connection.
    async def _fake_connect_to_mongo() -> None:
        mongodb.db_instance.client = mock_client
        mongodb.db_instance.db = mock_db

    async def _fake_close_mongo_connection() -> None:
        return None

    async def _fake_init_db_indexes() -> None:
        return None

    monkeypatch.setattr(mongodb, "connect_to_mongo", _fake_connect_to_mongo)
    monkeypatch.setattr(mongodb, "close_mongo_connection", _fake_close_mongo_connection)
    monkeypatch.setattr(mongodb, "init_db_indexes", _fake_init_db_indexes)

    # The lifespan in app.main also imports these names directly, so patch the
    # references there too in case the lifespan runs.
    from app import main as app_main

    monkeypatch.setattr(app_main, "connect_to_mongo", _fake_connect_to_mongo)
    monkeypatch.setattr(app_main, "close_mongo_connection", _fake_close_mongo_connection)
    monkeypatch.setattr(app_main, "init_db_indexes", _fake_init_db_indexes)

    yield

    # Clean up so the next test starts from an empty in-memory store.
    mongodb.db_instance.client = None
    mongodb.db_instance.db = None

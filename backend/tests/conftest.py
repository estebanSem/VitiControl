"""Isolated database, uploads and cookie sessions for each API test."""

import os
import tempfile
from pathlib import Path

import pytest

_test_directory = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(_test_directory.name) / "test.db")
os.environ["ADMIN_PASSWORD"] = "test-secret-password"
os.environ["COOKIE_SECURE"] = "false"
os.environ["UPLOAD_DIR"] = str(Path(_test_directory.name) / "uploads")
os.environ["SEED_DEMO"] = "false"

from app.core.config import settings
from app.core.database import Base, engine
from app.core.security import login_attempts, sessions
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    sessions.clear()
    login_attempts.clear()
    with TestClient(app) as test_client:
        yield test_client
    for file in settings.uploads.iterdir():
        file.unlink()


@pytest.fixture
def authenticated_client(client):
    assert (
        client.post(
            "/api/login", json={"username": "admin", "password": "test-secret-password"}
        ).status_code
        == 200
    )
    return client

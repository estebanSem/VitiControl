"""Regression coverage for separately registered API routers."""


def create_record(client):
    client.post("/api/campaigns", json={"year": 2026, "name": "Campaña 2026"})
    parcel = client.post(
        "/api/parcels",
        json={
            "name": "Solana",
            "variety": "Monastrell",
            "area": 1,
            "vines": 100,
            "planted": 2010,
        },
    ).json()
    body = {
        "parcel_id": parcel["id"],
        "campaign": 2026,
        "kind": "Tarea",
        "date": "2026-09-30",
        "title": "Revisar goteo",
        "completed": False,
    }
    record = client.post("/api/records", json=body).json()
    return parcel, body, record


def test_public_health_and_private_routers(client):
    assert client.get("/api/health").json() == {"status": "ok", "database": "sqlite"}
    for path in [
        "/api/me",
        "/api/parcels",
        "/api/campaigns",
        "/api/records",
        "/api/records/1/photos",
        "/api/photos/1",
        "/api/export?campaign=2026",
    ]:
        assert client.get(path).status_code == 401


def test_parcel_edit_record_filters_and_completion(authenticated_client):
    client = authenticated_client
    parcel, body, record = create_record(client)
    updated = client.put(
        f"/api/parcels/{parcel['id']}", json={**parcel, "name": "Solana norte"}
    )
    assert updated.json()["name"] == "Solana norte"
    assert (
        len(client.get(f"/api/records?campaign=2026&parcel_id={parcel['id']}").json())
        == 1
    )
    assert client.get("/api/records?campaign=2025").json() == []
    updated = client.put(
        f"/api/records/{record['id']}", json={**body, "completed": True}
    )
    assert updated.json()["completed"] is True
    assert "Solana norte" in client.get("/api/export?campaign=2026").text


def test_photo_download_and_record_cleanup(authenticated_client):
    client = authenticated_client
    _, _, record = create_record(client)
    raw = b"\x89PNG\r\n\x1a\n" + b"0" * 10
    photo = client.post(
        f"/api/records/{record['id']}/photos",
        files={"file": ("test.png", raw, "image/png")},
    ).json()
    downloaded = client.get(photo["url"])
    assert downloaded.content == raw
    assert downloaded.headers["x-content-type-options"] == "nosniff"
    assert client.delete(f"/api/records/{record['id']}").status_code == 204
    assert client.get(photo["url"]).status_code == 404


def test_missing_entities_and_treatment_validation(authenticated_client):
    client = authenticated_client
    _, body, _ = create_record(client)
    assert (
        client.post("/api/records", json={**body, "kind": "Tratamiento"}).status_code
        == 422
    )
    assert (
        client.post("/api/records", json={**body, "campaign": 2025}).status_code == 422
    )
    assert client.delete("/api/records/999").status_code == 404
    assert client.delete("/api/parcels/999").status_code == 404


def test_login_rate_limit(client):
    for _ in range(10):
        assert (
            client.post(
                "/api/login", json={"username": "admin", "password": "wrong"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/login", json={"username": "admin", "password": "wrong"}
        ).status_code
        == 429
    )

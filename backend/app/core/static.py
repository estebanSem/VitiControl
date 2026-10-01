from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings


def mount_frontend(app: FastAPI):
    static = settings.static
    if not static.exists():
        return
    app.mount("/assets", StaticFiles(directory=static), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404)
        target = (static / path).resolve()
        if target.is_relative_to(static.resolve()) and target.is_file():
            return FileResponse(target)
        return FileResponse(static / "index.html")

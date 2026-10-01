import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./viticontrol.db")
    admin_user: str = os.getenv("ADMIN_USER", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "")
    cookie_secure: bool = os.getenv("COOKIE_SECURE", "true") == "true"
    seed_demo: bool = os.getenv("SEED_DEMO", "false") == "true"
    uploads: Path = Path(os.getenv("UPLOAD_DIR", "./uploads"))
    static: Path = Path(os.getenv("STATIC_DIR", "../dist"))


settings = Settings()

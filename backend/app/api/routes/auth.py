from fastapi import APIRouter, Depends, Request, Response

from app.core.security import authenticated
from app.schemas import Login
from app.services import auth as service

router = APIRouter(tags=["auth"])


@router.post("/api/login")
def login(body: Login, response: Response, request: Request):
    return service.login(body=body, response=response, request=request)


@router.post("/api/logout")
def logout(request: Request, response: Response):
    return service.logout(request=request, response=response)


@router.get("/api/me", dependencies=[Depends(authenticated)])
def me():
    return service.me()

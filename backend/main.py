import os, secrets, hmac, csv, io, time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import create_engine, String, Float, Integer, Text, ForeignKey, select, Date, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

DATABASE_URL=os.getenv('DATABASE_URL','sqlite:///./viticontrol.db')
engine=create_engine(DATABASE_URL,connect_args={'check_same_thread':False} if DATABASE_URL.startswith('sqlite') else {})
SessionLocal=sessionmaker(engine)
class Base(DeclarativeBase): pass
class Parcel(Base):
    __tablename__='parcels'
    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str]=mapped_column(String(100))
    variety: Mapped[str]=mapped_column(String(100))
    area: Mapped[float]=mapped_column(Float)
    vines: Mapped[int]=mapped_column(Integer)
    planted: Mapped[int]=mapped_column(Integer)
    location: Mapped[str]=mapped_column(String(150),default='')
    notes: Mapped[str]=mapped_column(Text,default='')
class Campaign(Base):
    __tablename__='campaigns'
    id: Mapped[int]=mapped_column(primary_key=True)
    year: Mapped[int]=mapped_column(Integer,unique=True)
    name: Mapped[str]=mapped_column(String(100))
class Record(Base):
    __tablename__='records'
    id: Mapped[int]=mapped_column(primary_key=True)
    parcel_id: Mapped[int]=mapped_column(ForeignKey('parcels.id'))
    campaign: Mapped[int]=mapped_column(Integer)
    kind: Mapped[str]=mapped_column(String(30))
    date: Mapped[date]=mapped_column(Date)
    title: Mapped[str]=mapped_column(String(150))
    notes: Mapped[str]=mapped_column(Text,default='')
    cost: Mapped[float]=mapped_column(Float,default=0)
    quantity: Mapped[float]=mapped_column(Float,default=0)
    brix: Mapped[float | None]=mapped_column(Float,nullable=True)
    product: Mapped[str]=mapped_column(String(150),default='')
    dose: Mapped[str]=mapped_column(String(100),default='')
    unit: Mapped[str]=mapped_column(String(30),default='')
    completed: Mapped[bool]=mapped_column(Boolean,default=True)
class Photo(Base):
    __tablename__='photos'
    id: Mapped[int]=mapped_column(primary_key=True)
    record_id: Mapped[int]=mapped_column(ForeignKey('records.id'))
    filename: Mapped[str]=mapped_column(String(100))
    mime: Mapped[str]=mapped_column(String(40))
class Login(BaseModel):
    username: str
    password: str
class ParcelInput(BaseModel):
    name: str=Field(min_length=1,max_length=100)
    variety: str=Field(min_length=1,max_length=100)
    area: float=Field(gt=0,le=100000)
    vines: int=Field(ge=0)
    planted: int=Field(ge=1800,le=2100)
    location: str=Field(default='',max_length=150)
    notes: str=Field(default='',max_length=5000)
class CampaignInput(BaseModel):
    year: int=Field(ge=1900,le=2100)
    name: str=Field(min_length=1,max_length=100)
class RecordInput(BaseModel):
    parcel_id: int
    campaign: int=Field(ge=1900,le=2100)
    kind: Literal['Riego','Tratamiento','Poda','Abonado','Vendimia','Incidencia','Tarea']
    date: date
    title: str=Field(min_length=1,max_length=150)
    notes: str=Field(default='',max_length=5000)
    cost: float=Field(default=0,ge=0)
    quantity: float=Field(default=0,ge=0)
    brix: float | None=Field(default=None,ge=0,le=60)
    product: str=Field(default='',max_length=150)
    dose: str=Field(default='',max_length=100)
    unit: str=Field(default='',max_length=30)
    completed: bool=True
    @model_validator(mode='after')
    def check(self):
        if self.kind=='Tratamiento' and not self.product.strip(): raise ValueError('Indica el producto del tratamiento')
        if self.kind=='Vendimia' and self.quantity<=0: raise ValueError('Indica los kilos recogidos')
        return self

def db():
    with SessionLocal() as s: yield s
sessions={}
login_attempts={}
ADMIN_USER=os.getenv('ADMIN_USER','admin')
ADMIN_PASSWORD=os.getenv('ADMIN_PASSWORD','')
from fastapi import Request

def authenticated(request:Request):
    token=request.cookies.get('viti_session','')
    expiry=sessions.get(token)
    if not expiry or expiry<datetime.now(timezone.utc):
        sessions.pop(token,None)
        raise HTTPException(401,'Inicia sesión para continuar')
    return ADMIN_USER

app=FastAPI(title='VitiControl API',version='1.0.0')
Base.metadata.create_all(engine)
UPLOADS=Path(os.getenv('UPLOAD_DIR','./uploads')); UPLOADS.mkdir(parents=True,exist_ok=True)

def serialize(obj): return {c.name:getattr(obj,c.name) for c in obj.__table__.columns}

@app.get('/api/health')
def health(): return {'status':'ok','database':engine.dialect.name}
@app.post('/api/login')
def login(body:Login,response:Response,request:Request):
    ip=request.client.host if request.client else 'unknown'
    now=time.monotonic()
    attempts=[t for t in login_attempts.get(ip,[]) if now-t<60]
    if len(attempts)>=10:raise HTTPException(429,'Demasiados intentos. Espera un minuto.')
    login_attempts[ip]=[*attempts,now]

    if not ADMIN_PASSWORD: raise HTTPException(503,'Configura ADMIN_PASSWORD en el servidor')
    if not (hmac.compare_digest(body.username,ADMIN_USER) and hmac.compare_digest(body.password,ADMIN_PASSWORD)):
        raise HTTPException(401,'Usuario o contraseña incorrectos')
    token=secrets.token_urlsafe(32); sessions[token]=datetime.now(timezone.utc)+timedelta(hours=12)
    response.set_cookie('viti_session',token,httponly=True,samesite='strict',secure=os.getenv('COOKIE_SECURE','true')=='true',max_age=43200)
    return {'username':ADMIN_USER}
@app.post('/api/logout')
def logout(request:Request,response:Response):
    sessions.pop(request.cookies.get('viti_session',''),None);response.delete_cookie('viti_session');return {'ok':True}
@app.get('/api/me',dependencies=[Depends(authenticated)])
def me():return {'username':ADMIN_USER}
@app.get('/api/parcels',dependencies=[Depends(authenticated)])
def parcels(s:Session=Depends(db)):return [serialize(p) for p in s.scalars(select(Parcel).order_by(Parcel.id))]
@app.post('/api/parcels',status_code=201,dependencies=[Depends(authenticated)])
def add_parcel(body:ParcelInput,s:Session=Depends(db)):
    p=Parcel(**body.model_dump());s.add(p);s.commit();s.refresh(p);return serialize(p)
@app.put('/api/parcels/{id}',dependencies=[Depends(authenticated)])
def edit_parcel(id:int,body:ParcelInput,s:Session=Depends(db)):
    p=s.get(Parcel,id)
    if not p:raise HTTPException(404,'Parcela no encontrada')
    for k,v in body.model_dump().items():setattr(p,k,v)
    s.commit();return serialize(p)
@app.delete('/api/parcels/{id}',status_code=204,dependencies=[Depends(authenticated)])
def delete_parcel(id:int,s:Session=Depends(db)):
    p=s.get(Parcel,id)
    if not p:raise HTTPException(404,'Parcela no encontrada')
    if s.scalar(select(Record).where(Record.parcel_id==id)):raise HTTPException(409,'La parcela tiene registros. Conserva su histórico o elimina primero los registros.')
    s.delete(p);s.commit()
@app.get('/api/campaigns',dependencies=[Depends(authenticated)])
def campaigns(s:Session=Depends(db)):return [serialize(p) for p in s.scalars(select(Campaign).order_by(Campaign.year.desc()))]
@app.post('/api/campaigns',status_code=201,dependencies=[Depends(authenticated)])
def add_campaign(body:CampaignInput,s:Session=Depends(db)):
    if s.scalar(select(Campaign).where(Campaign.year==body.year)):raise HTTPException(409,'La campaña ya existe')
    p=Campaign(**body.model_dump());s.add(p);s.commit();s.refresh(p);return serialize(p)
@app.get('/api/records',dependencies=[Depends(authenticated)])
def records(campaign:int|None=None,parcel_id:int|None=None,s:Session=Depends(db)):
    q=select(Record).order_by(Record.date.desc(),Record.id.desc())
    if campaign:q=q.where(Record.campaign==campaign)
    if parcel_id:q=q.where(Record.parcel_id==parcel_id)
    return [serialize(p) for p in s.scalars(q)]
def validate_links(body,s):
    if not s.get(Parcel,body.parcel_id):raise HTTPException(422,'Parcela no encontrada')
    if not s.scalar(select(Campaign).where(Campaign.year==body.campaign)):raise HTTPException(422,'Campaña no encontrada')
@app.post('/api/records',status_code=201,dependencies=[Depends(authenticated)])
def add_record(body:RecordInput,s:Session=Depends(db)):
    validate_links(body,s);p=Record(**body.model_dump());s.add(p);s.commit();s.refresh(p);return serialize(p)
@app.put('/api/records/{id}',dependencies=[Depends(authenticated)])
def edit_record(id:int,body:RecordInput,s:Session=Depends(db)):
    p=s.get(Record,id)
    if not p:raise HTTPException(404,'Registro no encontrado')
    validate_links(body,s)
    for k,v in body.model_dump().items():setattr(p,k,v)
    s.commit();return serialize(p)
@app.delete('/api/records/{id}',status_code=204,dependencies=[Depends(authenticated)])
def delete_record(id:int,s:Session=Depends(db)):
    p=s.get(Record,id)
    if not p:raise HTTPException(404,'Registro no encontrado')
    for photo in s.scalars(select(Photo).where(Photo.record_id==id)):
        (UPLOADS/photo.filename).unlink(missing_ok=True);s.delete(photo)
    s.delete(p);s.commit()
@app.post('/api/records/{id}/photos',status_code=201,dependencies=[Depends(authenticated)])
async def upload(id:int,file:UploadFile=File(...),s:Session=Depends(db)):
    if not s.get(Record,id):raise HTTPException(404,'Registro no encontrado')
    raw=await file.read(5*1024*1024+1)
    if len(raw)>5*1024*1024:raise HTTPException(413,'La fotografía no puede superar 5 MB')
    if raw.startswith(b'\xff\xd8\xff'):ext='jpg';mime='image/jpeg'
    elif raw.startswith(b'\x89PNG\r\n\x1a\n'):ext='png';mime='image/png'
    elif raw[:4]==b'RIFF' and raw[8:12]==b'WEBP':ext='webp';mime='image/webp'
    else:raise HTTPException(415,'Utiliza una imagen JPEG, PNG o WebP')
    filename=secrets.token_hex(20)+'.'+ext;(UPLOADS/filename).write_bytes(raw)
    p=Photo(record_id=id,filename=filename,mime=mime);s.add(p);s.commit();s.refresh(p);return {'id':p.id,'url':f'/api/photos/{p.id}'}
@app.get('/api/records/{id}/photos',dependencies=[Depends(authenticated)])
def photos(id:int,s:Session=Depends(db)):return [{'id':p.id,'url':f'/api/photos/{p.id}'} for p in s.scalars(select(Photo).where(Photo.record_id==id))]
@app.get('/api/photos/{id}',dependencies=[Depends(authenticated)])
def photo(id:int,s:Session=Depends(db)):
    p=s.get(Photo,id)
    if not p:raise HTTPException(404,'Fotografía no encontrada')
    return FileResponse(UPLOADS/p.filename,media_type=p.mime,headers={'X-Content-Type-Options':'nosniff'})
@app.get('/api/export',dependencies=[Depends(authenticated)])
def export(campaign:int,s:Session=Depends(db)):
    buf=io.StringIO();writer=csv.writer(buf);writer.writerow(['Fecha','Parcela','Tipo','Título','Coste EUR','Cantidad','Unidad','Brix','Producto','Dosis','Observaciones'])
    def safe(v):
        text=str(v or '')
        return "'"+text if text.startswith(('=','+','-','@','\t','\r')) else text
    for r in s.scalars(select(Record).where(Record.campaign==campaign).order_by(Record.date)):
        writer.writerow([safe(v) for v in [r.date,s.get(Parcel,r.parcel_id).name,r.kind,r.title,r.cost,r.quantity,r.unit,r.brix,r.product,r.dose,r.notes]])
    return Response('\ufeff'+buf.getvalue(),media_type='text/csv',headers={'Content-Disposition':f'attachment; filename="campana-{campaign}.csv"'})

# Sample data is opt-in. Production starts with an empty notebook.
if os.getenv('SEED_DEMO','false')=='true':
    from seed import seed
    with SessionLocal() as s:seed(s,Parcel,Campaign,Record)
STATIC=Path(os.getenv('STATIC_DIR','../dist'))
if STATIC.exists():
    app.mount('/assets',StaticFiles(directory=STATIC),name='assets')
    @app.get('/{path:path}')
    def frontend(path:str):
        if path.startswith('api/'):raise HTTPException(404)
        target=(STATIC/path).resolve()
        if target.is_relative_to(STATIC.resolve()) and target.is_file():return FileResponse(target)
        return FileResponse(STATIC/'index.html')

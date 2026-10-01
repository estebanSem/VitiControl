import os
import tempfile
os.environ['DATABASE_URL']='sqlite:///'+tempfile.mktemp(suffix='.db')
os.environ['ADMIN_PASSWORD']='test-secret-password'
os.environ['COOKIE_SECURE']='false'
os.environ['UPLOAD_DIR']=tempfile.mkdtemp()
os.environ['SEED_DEMO']='false'
from fastapi.testclient import TestClient
from main import app
client=TestClient(app)

def test_full_workflow():
    assert client.get('/api/parcels').status_code==401
    assert client.post('/api/login',json={'username':'admin','password':'incorrect'}).status_code==401
    assert client.post('/api/login',json={'username':'admin','password':'test-secret-password'}).status_code==200
    assert client.post('/api/campaigns',json={'year':2026,'name':'Campaña 2026'}).status_code==201
    assert client.post('/api/campaigns',json={'year':2026,'name':'Duplicada'}).status_code==409
    parcel={'name':'Bancal','variety':'Monastrell','area':1.2,'vines':500,'planted':2008}
    assert client.post('/api/parcels',json={**parcel,'area':-1}).status_code==422
    p=client.post('/api/parcels',json=parcel).json()
    record={'parcel_id':p['id'],'campaign':2026,'kind':'Vendimia','date':'2026-09-18','title':'=Fórmula','quantity':1600,'unit':'kg','brix':24.1,'cost':95}
    assert client.post('/api/records',json={**record,'parcel_id':999}).status_code==422
    assert client.post('/api/records',json={**record,'quantity':0}).status_code==422
    r=client.post('/api/records',json=record);assert r.status_code==201
    rid=r.json()['id']
    assert client.delete('/api/parcels/'+str(p['id'])).status_code==409
    assert client.put('/api/records/'+str(rid),json={**record,'cost':120}).json()['cost']==120
    assert client.post(f'/api/records/{rid}/photos',files={'file':('x.html',b'<script>x</script>','text/html')}).status_code==415
    assert client.post(f'/api/records/{rid}/photos',files={'file':('x.png',b'\x89PNG\r\n\x1a\n' + b'0'*10,'image/png')}).status_code==201
    assert len(client.get(f'/api/records/{rid}/photos').json())==1
    exported=client.get('/api/export?campaign=2026');assert exported.status_code==200;assert "'=Fórmula" in exported.text
    assert client.delete('/api/records/'+str(rid)).status_code==204
    assert client.get(f'/api/records/{rid}/photos').json()==[]
    assert client.delete('/api/parcels/'+str(p['id'])).status_code==204
    client.post('/api/logout');assert client.get('/api/records').status_code==401

# VitiControl

Cuaderno de campo familiar. Angular 20 + FastAPI + SQLAlchemy + PostgreSQL 16.
Interfaz en español, adaptable al móvil, con blanco, negro y morado.

## Qué incluye

- Parcelas: variedad, hectáreas, cepas, año de plantación, ubicación y observaciones.
- Campañas por año e histórico.
- Cuaderno con riegos, tratamientos, poda, abonado, vendimia e incidencias.
- Tratamientos con producto/dosis; riegos con cantidad y unidad; vendimias con kg y Brix opcional.
- Creación, edición y eliminación de registros. Protección del histórico al eliminar parcelas.
- Agenda de labores pendientes, fechas y tareas atrasadas; completar y reabrir tareas.
- Fotografías JPEG/PNG/WebP hasta 5 MB por archivo, servidas con autenticación.
- Resumen, producción por parcela, histórico de campañas, rendimiento y costes.
- Búsqueda, filtros y exportación CSV compatible con Excel en UTF-8.
- Inicio de sesión privado, cookies HttpOnly, caducidad a 12 horas y cierre de sesión.

## Arranque completo con Docker (recomendado)

Necesitas Docker Desktop con Compose.

```bash
cp .env.example .env
# Edita .env: cambia las DOS contraseñas antes de arrancar.
docker compose up --build -d
```

Abre http://localhost:8000. Usuario y contraseña: los configurados en `.env`.
El primer arranque está vacío. Crea una campaña, añade una parcela y registra una labor.
Para cargar datos ficticios en una base vacía: `SEED_DEMO=true` en `.env` y recrea el servicio.
No se importa si ya existen campañas. La demo no representa recomendaciones de tratamiento.

Una misma aplicación FastAPI sirve el frontend compilado y `/api`. La base de datos
no expone puertos y los datos/fotografías permanecen en volúmenes Docker.

```bash
docker compose logs -f app
docker compose stop
docker compose up -d
```

**No uses `docker compose down -v` para detenerla: elimina los volúmenes y sus datos.**

## Desarrollo sin Docker

```bash
cd backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configura `ADMIN_PASSWORD`, `COOKIE_SECURE=false` y opcionalmente `SEED_DEMO=true`
en el entorno de tu terminal antes de `uvicorn main:app --reload`.
Por defecto se usa SQLite para desarrollo. Para PostgreSQL establece
`DATABASE_URL=postgresql+psycopg://usuario:clave@host:5432/viticontrol`.

En otra terminal:

```bash
cd frontend
npm ci
npm start
```

Abre http://localhost:4200. El proxy envía `/api` a FastAPI en el puerto 8000.
Se recomienda Node 22 o 24 y Python 3.12. `.env` es leído por Compose;
para desarrollo sin Docker hay que exportar esas variables manualmente.
En PowerShell: `$env:ADMIN_PASSWORD="tu-clave"; $env:COOKIE_SECURE="false"`.

## Demostración independiente

```bash
cd frontend
npm ci
npm run build:demo
# Sirve ../dist con un servidor de archivos estáticos.
```

La compilación demo reemplaza `environment.ts`, usa registros ficticios y almacena
cambios/fotos en localStorage **solo en ese navegador**. No se conecta a PostgreSQL,
no sincroniza dispositivos ni migra automáticamente los cambios al backend real.
No utilices la demo para datos reales. El botón Restaurar elimina sus cambios.
La compilación normal (`npm run build`) siempre utiliza FastAPI: nunca cae a la demo.

## Verificación

```bash
cd backend
python -m pytest -q
cd ../frontend
npm run build
npm run build:demo
```

La prueba integra acceso privado, validación, campañas duplicadas, alta/edición/eliminación,
relaciones, bloqueo de borrado con histórico, fotografías, CSV y logout.

## Publicación real y copias de seguridad

El enlace web de demostración solo aloja Angular. El backend Python y PostgreSQL
requieren un host compatible con Docker (mini-PC, VPS o plataforma de contenedores).
Configura HTTPS mediante un proxy inverso y `COOKIE_SECURE=true`. Compose limita el
acceso a localhost por defecto; cambia el enlace solo en una red de confianza.

Este MVP usa un único administrador para una explotación familiar. Las sesiones
son temporales y se invalidan al reiniciar el servidor; utiliza un solo worker como
indica Dockerfile. No incluye roles, recuperación de contraseña, facturación,
automatización de riego ni validación agronómica de productos/dosis.

Para cambios de esquema antes de producción, añade migraciones Alembic:
`create_all` crea las tablas iniciales, pero no migra columnas ya existentes.
Realiza copia de PostgreSQL y del volumen de fotografías antes de modificar versiones.

```bash
docker compose exec -T db pg_dump -U viticontrol viticontrol > backup.sql
docker compose cp app:/app/uploads ./backup-photos
# Restaurar SQL en una base preparada: psql -U viticontrol -d viticontrol < backup.sql
```

El cuaderno ayuda a registrar el trabajo; no es un cuaderno oficial homologado ni
prescribe dosis, tratamientos o fechas de aplicación. Brix se registra manualmente;
no estima alcohol a partir de él. Los informes reflejan solo registros completados.

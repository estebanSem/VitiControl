# Estructura de desarrollo

El frontend conserva Angular standalone con signals y el backend FastAPI con
SQLAlchemy. La separación mantiene las URL de la API, los nombres de tablas,
las cookies y las claves de localStorage existentes. No requiere migrar datos.

## Backend

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `backend/main.py` | Entrada compatible con `uvicorn main:app`. |
| `backend/app/main.py` | Crear FastAPI, registrar routers y ejecutar el ciclo de vida. |
| `backend/app/core/config.py` | Leer la configuración del entorno. |
| `backend/app/core/database.py` | Engine, sesiones, Base y dependencia de base de datos. |
| `backend/app/core/security.py` | Validación de sesión y almacenamiento temporal de autenticación. |
| `backend/app/core/static.py` | Servir Angular y proteger las rutas estáticas. |
| `backend/app/models/` | Una clase ORM por archivo: parcela, campaña, registro y fotografía. |
| `backend/app/schemas/` | Contratos Pydantic y validaciones de entrada por entidad. |
| `backend/app/api/routes/` | Rutas HTTP, parámetros, códigos de respuesta y dependencias. |
| `backend/app/services/` | Operaciones de cada dominio, fotos, exportación, serialización y demo. |
| `backend/tests/` | Pruebas con base de datos, archivos y sesiones aislados. |

Las rutas llaman a servicios y les pasan una sesión SQLAlchemy. Los servicios
usan los modelos ORM; los schemas validan los datos antes de ejecutar operaciones.
Los servicios pueden devolver errores HTTP para conservar el contrato del MVP.

La creación de tablas, el directorio de fotografías y el seed se ejecutan durante
el `lifespan` de FastAPI. Importar un módulo ya no intenta conectar con PostgreSQL.
`create_all` conserva su función anterior: no sustituye a migraciones de esquema.

Para una nueva funcionalidad: crea su modelo/schema si corresponde, añade su
servicio, incorpora un router y regístralo en `app/api/router.py`. Añade pruebas
del comportamiento relevante. No vuelvas a colocar lógica de negocio en `main.py`.

## Frontend

| Carpeta o archivo | Responsabilidad |
| --- | --- |
| `frontend/src/main.ts` | Arrancar Angular. |
| `frontend/src/app/app.config.ts` | Providers y registro de iconos. |
| `frontend/src/app/app.component.*` | Componer la aplicación y seleccionar la vista activa. |
| `frontend/src/app/layout/` | Sidebar y cabecera. |
| `frontend/src/app/features/` | Resumen, parcelas, cuaderno, agenda, informes, configuración y login. |
| `frontend/src/app/shared/forms/` | Formularios de parcela, campaña y registro. |
| `frontend/src/app/shared/dialogs/` | Modal compartido y detalle del registro. |
| `frontend/src/app/models/` | Interfaces del cuaderno, formularios, fotos e integración del navegador. |
| `frontend/src/app/demo/` | Datos ficticios separados de los contratos. |
| `frontend/src/app/core/` | Servicios y estado compartido. |
| `frontend/src/styles/` | Estilos base, layout, componentes compartidos y adaptación responsive. |
| `frontend/tests/` | Pruebas de navegación, formularios, persistencia y móvil. |

Servicios principales:

- `ApiService`: transporte HTTP, errores de API y pérdida de sesión.
- `AuthService` y `SessionState`: login, logout y estado de autenticación.
- `NotebookStore`: datos, campaña, filtros, métricas y actualización del cuaderno.
- `NavigationService`: vista seleccionada y menú móvil.
- `EditorService`: apertura, edición, validación y guardado de los formularios.
- `PhotoService`: envío y almacenamiento de fotografías.
- `ExportService`: descarga CSV.
- `DisplayService`: formato de números, fechas, euros e iconos.
- `UiState`: errores, estado de guardado y notificaciones.
- `ModelToolsService`: integración opcional con las herramientas del navegador.

Cada vista tiene su propio HTML y componente. Los componentes consumen servicios
mediante inyección; no heredan una clase gigante ni duplican todo el estado.
Los formularios se registran en el `NgForm` del diálogo mediante `ControlContainer`.
Los estilos siguen siendo compartidos para conservar la cascada y el diseño
existentes. La navegación sigue siendo interna por estado, sin nuevas URL o router.

Para una nueva pantalla: crea un componente en `features`, registra su selector
en el shell y añade navegación. Las operaciones HTTP van en servicios, los
contratos en `models` y los cálculos compartidos en el store. Mantén los formularios
fuera del shell.

## Comprobaciones

```bash
cd backend
python -m pytest -q
cd ../frontend
npm ci
npm run build:demo
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:integration
```

Las pruebas de navegador arrancan automáticamente la demo en el puerto 4300.
La prueba de integración requiere Python con las dependencias del backend
instaladas y una compilación normal (`npm run build`) en `dist`. Arranca FastAPI
en el puerto 8001 y utiliza una base SQLite temporal. Comprueba login, guardado
a través de la API, recarga y logout.

Los artefactos `dist`, los informes de Playwright y `node_modules` no se versionan.
Docker genera `dist` durante su fase de construcción de Angular.

En Codespaces se conserva `network_mode: service:db`. Por eso la aplicación
conecta a PostgreSQL usando `127.0.0.1:5432` y el puerto 8000 se publica desde `db`.
Esta configuración evita la comunicación entre contenedores que fallaba en ese
entorno; no diagnostica ni repara la causa del bloqueo de la red bridge.

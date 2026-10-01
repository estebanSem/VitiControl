# Validación de la reestructuración de VitiControl

Comprobaciones ejecutadas sobre esta versión:

- Angular producción: compilación correcta con plantillas y TypeScript estrictos.
- Angular demo: compilación correcta.
- Backend: 6 pruebas superadas sobre SQLite temporal, con aislamiento por prueba.
  Incluyen autenticación, limitación de login, validaciones, relaciones, filtros,
  edición de parcelas y registros, agenda, fotografías, CSV y borrado del histórico.
- Navegador Chromium: 3 pruebas superadas para navegación por todas las vistas,
  los formularios separados de parcela/campaña/registro, persistencia de la demo,
  detalle del registro, Escape y navegación móvil.
- Integración navegador + FastAPI: 1 prueba superada sobre la compilación normal.
  Login, creación de campaña/parcela/riego mediante la API, persistencia después
  de recargar y logout. Usa SQLite y archivos temporales.
- Backend: imports y sintaxis comprobados mediante Ruff (reglas F e I).

Total: 10 pruebas automatizadas superadas, además de las dos compilaciones.

No hay Docker disponible en el entorno local de validación. El workflow
`.github/workflows/validate.yml` incluye un job independiente que construye
la imagen, arranca Compose con PostgreSQL y consulta `/api/health`. Su resultado
solo queda confirmado cuando se ejecuta y termina en GitHub Actions.

Las tablas, contratos HTTP y claves de localStorage conservan sus nombres.
Esta refactorización no introduce migraciones de esquema. La configuración de
Codespaces conserva la red compartida y corrige el host a `127.0.0.1`.
No se ha probado WebMCP nativo ni se ha cambiado el despliegue de la web demo.

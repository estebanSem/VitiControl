# Validación de VitiControl

- Compilación Angular de producción: correcta.
- Compilación Angular de demo: correcta.
- API: prueba de integración superada con SQLite temporal (acceso privado,
  validaciones, campañas, parcelas, vendimia, edición, fotografías, borrado,
  exportación y cierre de sesión).
- Interfaz: comprobación con DOM simulado del resumen, formulario, guardado
  local, parcelas, tareas, cuaderno e informes.
- Herramientas para agentes: registro y validación de entradas comprobados con
  una implementación simulada. No se ha verificado un navegador con WebMCP nativo.
- No se ha ejecutado Docker ni un PostgreSQL real en este entorno.
- No se ha realizado verificación visual en navegador. Los estilos incluyen
  puntos de adaptación para escritorio/tablet/móvil y reducción de movimiento.

El paquete es una primera versión funcional familiar. La web desplegada es
una demo independiente; para datos reales utiliza el arranque completo del README.

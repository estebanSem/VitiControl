export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la operación";
}

import { test, expect } from "@playwright/test";

test("normal build logs in, saves through FastAPI, survives reload and logs out", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByLabel("Usuario", { exact: true }).fill("admin");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("integration-test-password");
  await page
    .getByRole("button", { name: "Entrar a mi cuaderno", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Una mirada a tu viñedo." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva campaña", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Año", { exact: true }).fill("2026");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Parcelas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva parcela", exact: true })
    .click();
  await dialog.getByLabel("Nombre de la parcela").fill("Bancal real");
  await dialog.getByLabel("Variedad de uva").fill("Monastrell");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Cuaderno de campo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Registrar labor", exact: true })
    .click();
  await dialog.getByLabel("Título del registro").fill("Riego desde API");
  await dialog.getByLabel("Cantidad de riego").fill("2");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Riego desde API/ }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Cuaderno de campo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Riego desde API/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

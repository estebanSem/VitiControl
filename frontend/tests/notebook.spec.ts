import { test, expect } from "@playwright/test";

test("navigates through every extracted view without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Una mirada a tu viñedo." }),
  ).toBeVisible();
  for (const label of ["Parcelas", "Cuaderno de campo", "Agenda", "Informes"]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name: label })
      .click();
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Campañas", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("saves extracted parcel, campaign and record forms and persists the demo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Parcelas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva parcela", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre de la parcela").fill("Parcela de prueba");
  await dialog.getByLabel("Variedad de uva").fill("Monastrell");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Parcela de prueba", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva campaña", exact: true })
    .click();
  await dialog.getByLabel("Año", { exact: true }).fill("2027");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Campaña", exact: true }),
  ).toHaveValue(/2027$/);

  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Cuaderno de campo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Registrar labor", exact: true })
    .click();
  await dialog.getByLabel("Título del registro").fill("Riego de prueba");
  await dialog.getByLabel("Cantidad de riego").fill("2");
  await dialog.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Riego de prueba/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Riego de prueba/ }).click();
  await expect(
    dialog.getByRole("heading", { name: "Riego de prueba", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await page
    .getByRole("combobox", { name: "Campaña", exact: true })
    .selectOption({ label: "2027" });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Cuaderno de campo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Riego de prueba/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile menu opens a separate view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menú", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Parcelas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Parcelas", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cerrar menú", exact: true }),
  ).not.toBeVisible();
});

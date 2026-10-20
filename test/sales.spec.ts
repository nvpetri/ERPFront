import { test, expect } from "@playwright/test";
test("manager sells by unit and weight, personalizes brand, controls modules and works on mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByLabel("E-mail", { exact: true }).fill("manager@example.test");
  await page
    .getByLabel("Senha", { exact: true })
    .fill("ci-only-manager-password-123");
  await page.getByRole("button", { name: "Acessar meu painel" }).click();
  await expect(
    page.getByRole("heading", { name: "Vamos vender?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Produtos", exact: true }).click();
  await page.getByRole("button", { name: "Novo produto" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Pão artesanal");
  await dialog.getByLabel("Código / SKU").fill("PAO-01");
  await dialog.getByLabel("Categoria").fill("Panificação");
  await dialog.getByLabel("Preço (R$)").fill("5,00");
  await dialog.getByRole("button", { name: "Salvar produto" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Novo produto" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Biscoito a granel");
  await dialog.getByLabel("Código / SKU").fill("BISC-01");
  await dialog.getByLabel("Categoria").fill("Granel");
  await dialog.getByLabel("Venda por").selectOption("KG");
  await dialog.getByLabel("Preço (R$)").fill("19,90");
  await dialog.getByRole("button", { name: "Salvar produto" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Frente de caixa", exact: true })
    .click();
  await page.getByRole("button", { name: /PAO-01/ }).click();
  await page.getByRole("button", { name: /BISC-01/ }).click();
  await page.getByLabel("Quantidade de Biscoito a granel").fill("0,250");
  await expect(page.locator(".grand-total")).toContainText("9,98");
  await page.screenshot({
    path: "test-results/pos-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Receber e finalizar" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "registrada com sucesso",
  );
  await page.getByRole("button", { name: "Vendas", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "R$ 9,98", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Abrir", exact: true })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Biscoito a granel");
  await expect(dialog).toContainText("Pão artesanal");
  await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await expect(page.locator(".metrics")).toContainText("9,98");
  await page
    .getByRole("button", { name: "Configurações", exact: true })
    .click();
  await page.getByLabel("Nome do estabelecimento").fill("Padaria Modelo");
  await page.getByLabel("Cor principal", { exact: true }).fill("#4e427b");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Configurações salvas");
  await expect(page.locator(".brand")).toContainText("Padaria Modelo");
  await page.getByRole("button", { name: "Módulos e atendimento" }).click();
  await page.getByLabel("Consulta de auditoria", { exact: false }).uncheck();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("button", { name: "Auditoria", exact: true }),
  ).toHaveCount(0);
  const denied = await page.request.get(
    "/api/audit?from=" +
      encodeURIComponent(new Date(Date.now() - 86400000).toISOString()) +
      "&to=" +
      encodeURIComponent(new Date(Date.now() + 86400000).toISOString()),
  );
  expect(denied.status()).toBe(403);
  await page.getByLabel("Consulta de auditoria", { exact: false }).check();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByRole("button", { name: "Auditoria", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("button", { name: "Frente de caixa", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Vamos vender?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /PAO-01/ }).click();
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right <= 0),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/pos-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.getByRole("button", { name: "Receber e finalizar" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fechar", exact: true })
    .click();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bom ter você aqui." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

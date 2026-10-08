import { expect, type Page } from '@playwright/test';
import { navigationItems } from '../../src/navigation/navigation-config';

export async function navigateFeature(page: Page, label: string) {
  const item = navigationItems.find(value => value.label === label)!;
  await expect(page.getByRole('button', { name: 'Menu da conta' })).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Barra lateral' });
  if (await sidebar.isVisible()) {
    const link = sidebar.getByRole('link', { name: label, exact: true });
    if (!await link.isVisible()) await sidebar.getByRole('button', { name: item.group, exact: true }).click();
    await link.click();
  } else {
    await page.getByRole('button', { name: 'Mais, abrir menu completo' }).click();
    await page.getByRole('dialog', { name: 'Todas as ferramentas' }).getByRole('link', { name: label, exact: true }).click();
  }
  await expect(page).toHaveURL(new RegExp(item.path + '(?:\\?.*)?$'));
}
export async function logoutThroughAccount(page: Page) {
  await page.getByRole('button', { name: 'Menu da conta' }).click();
  await page.getByRole('dialog', { name: 'Sua conta' }).getByRole('button', { name: 'Sair da conta' }).click();
}

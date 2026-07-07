import { expect, test } from '@playwright/test';

test('registers, displays, and deletes an iframe project', async ({ page }) => {
  const slug = `e2e-example-${Date.now()}`;
  const title = `E2E Example ${Date.now()}`;

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WEB동아리 웹 전시실' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '아무 작품도 선택하지 않았습니다' })).toBeVisible();

  await page.getByRole('button', { name: '새 작품 작성', exact: true }).click();
  await page.getByLabel('제목').fill(title);
  await page.getByLabel('슬러그').fill(slug);
  await page.getByLabel('팀명').fill('E2E 검증팀');
  await page.getByLabel('참여자').fill('Playwright');
  await page.getByLabel('설명').fill('실제 외부 사이트 URL을 iframe 전시로 등록하는 E2E 검증입니다.');
  await page.getByLabel('IFRAME URL').fill('https://example.com');
  await page.getByLabel('새 창 URL').fill('https://example.com');
  await page.getByLabel('GitHub URL').fill('https://github.com/shain1912/bmt-web-exhibition');
  await page.getByLabel('기술 스택').fill('Playwright, Supabase, IFRAME');
  await page.getByRole('textbox', { name: '카테고리' }).fill('E2E 검증');
  await page.getByLabel('학년/구분').fill('테스트');
  await page.getByLabel('정렬').fill('1');

  await page.getByRole('button', { name: '작품 등록' }).click();
  await expect(page.getByText('작품을 등록했습니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(title) })).toBeVisible();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://example.com');

  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '선택 작품 삭제' }).click();
  await expect(page.getByText('작품을 삭제했습니다.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '아무 작품도 선택하지 않았습니다' })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(title) })).toHaveCount(0);
});

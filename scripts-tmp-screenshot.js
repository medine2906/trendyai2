const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/VICTUS/AppData/Local/Temp/claude/c--Users-VICTUS-OneDrive-Documents-Masa-st--PROJECTS-trendyai/13645c19-0143-4ca0-b928-25f790b6672c/scratchpad/hero.png' });

  // hover the blob to check cursor chip
  const blobBox = await page.locator('main, body').first();
  await page.mouse.move(1100, 450);
  await page.waitForTimeout(300);
  await page.mouse.move(1120, 470);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'C:/Users/VICTUS/AppData/Local/Temp/claude/c--Users-VICTUS-OneDrive-Documents-Masa-st--PROJECTS-trendyai/13645c19-0143-4ca0-b928-25f790b6672c/scratchpad/hero-hover.png' });

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.1));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/VICTUS/AppData/Local/Temp/claude/c--Users-VICTUS-OneDrive-Documents-Masa-st--PROJECTS-trendyai/13645c19-0143-4ca0-b928-25f790b6672c/scratchpad/numbered.png' });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'C:/Users/VICTUS/AppData/Local/Temp/claude/c--Users-VICTUS-OneDrive-Documents-Masa-st--PROJECTS-trendyai/13645c19-0143-4ca0-b928-25f790b6672c/scratchpad/footer.png' });

  console.log('LOGS:', JSON.stringify(logs, null, 2));
  await browser.close();
})();

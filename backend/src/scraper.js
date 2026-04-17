const puppeteer = require("puppeteer");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeGoogleMaps(query, log) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  log("🚀 Iniciando...");

  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
  });

  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9",
  });

  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR`;

  await page.goto(searchUrl, {
    waitUntil: "networkidle2",
  });

  await sleep(5000);

  // fechar popup
  try {
    const buttons = await page.$$("button");

    for (let btn of buttons) {
      const text = await page.evaluate((el) => el.innerText, btn);

      if (
        text &&
        (text.toLowerCase().includes("aceitar") ||
          text.toLowerCase().includes("accept") ||
          text.toLowerCase().includes("concordo"))
      ) {
        await btn.click();
        log("🍪 Popup fechado");
        await sleep(3000);
        break;
      }
    }
  } catch {
    log("👍 Nenhum popup encontrado");
  }

  await page.waitForSelector('div[role="feed"]', {
    timeout: 20000,
  });

  const scrollableDiv = await page.$('div[role="feed"]');

  if (scrollableDiv) {
    for (let i = 0; i < 10; i++) {
      await page.evaluate((el) => el.scrollBy(0, 1000), scrollableDiv);
      await sleep(2000);
    }
  }

  const links = await page.$$eval('a[href*="/maps/place/"]', (anchors) =>
    anchors.map((a) => a.href),
  );

  const uniqueLinks = [...new Set(links)];

  log(`🔗 ${uniqueLinks.length} links encontrados`);

  const results = [];

  for (let link of uniqueLinks.slice(0, 15)) {
    try {
      await page.goto(link, { waitUntil: "networkidle2" });
      await sleep(3000);

      const data = await page.evaluate(() => {
        const getText = (selectors) => {
          for (let selector of selectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText) return el.innerText;
          }
          return "";
        };

        return {
          name: getText(["h1"]),
          address: getText([
            'button[data-item-id="address"]',
            'div[data-item-id="address"]',
          ]),
          phone: getText([
            'button[data-item-id^="phone"]',
            'div[data-item-id^="phone"]',
          ]),
          website:
            document.querySelector('a[data-item-id="authority"]')?.href || "",
        };
      });

      results.push(data);

      log(`📥 Lead capturado: ${data.name}`);

      await sleep(1500);
    } catch {
      log("⚠️ Erro ao processar um link");
    }
  }

  await browser.close();

  log("🏁 Scraping finalizado");

  return results;
}

module.exports = { scrapeGoogleMaps };

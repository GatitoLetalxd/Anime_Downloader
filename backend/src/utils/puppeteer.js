const puppeteer = require("puppeteer");

let puppeteerBrowser = null;
let launchPromise = null;

async function getSharedBrowser() {
  if (puppeteerBrowser) {
    return puppeteerBrowser;
  }
  if (launchPromise) {
    return launchPromise;
  }

  console.log("Puppeteer: Launching shared browser instance...");
  launchPromise = puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }).then((browser) => {
    puppeteerBrowser = browser;
    launchPromise = null;
    return browser;
  }).catch((err) => {
    launchPromise = null;
    console.error("Puppeteer: Failed to launch shared browser", err);
    throw err;
  });

  return launchPromise;
}

module.exports = {
  getSharedBrowser,
};

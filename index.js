const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        await page.goto('https://experts.shopify.com/');
        //this gets the four sections with experts
        await page.waitForSelector('._1_tev:nth-child(3) ._2fA-Y .XT3B4 ')
    
    } catch (e) {
        console.log(`our error: ${e}`)
    }
})()
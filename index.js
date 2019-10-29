const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

(async () => {
    try {
        const baseUrl = 'https://experts.shopify.com/'
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        
        await page.goto(baseUrl);
        await page.waitForSelector('._17BF0');
        let content = await page.content();
        const $ = cheerio.load(content)
        const hrefs = []
        const list = ($('._17BF0 ._3OHLp > div a'))
        for (let i = 0; i < list.length; i++) {
            hrefs.push($(list[i]).attr('href'))
        }
        
    } catch (e) {
        console.log(`our error: ${e}`)
    }
})()
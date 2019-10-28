const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        
        await page.goto('https://experts.shopify.com/');
        await page.waitForSelector('._17BF0');
        const sections = await page.$$('._17BF0');
        
        console.log(sections.length);
        
        for (const section of sections) {
            await page.goto('https://experts.shopify.com/');
            await page.waitForSelector('._17BF0');
            
            const divs = await section.$$('._3OHLp > div');
            console.log(divs.length)
            
            for (const div of divs) {
                div.click()
                await page.waitForSelector('._2fA-Y')
            }
        }
    
    } catch (e) {
        console.log(`our error: ${e}`)
    }
})()
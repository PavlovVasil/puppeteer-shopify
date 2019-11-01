const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
    try {
        const baseUrl = 'https://experts.shopify.com';
        //const baseUrl = 'https://experts.shopify.com/services/visual-content-and-branding/develop-brand-look-and-feel?page=18'
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
         //constructing all urls to be scraped
        //const expertsUrls = [];
        await page.goto(baseUrl);
        //await page.waitForSelector('._17BF0');
        let content = await page.content();
        const $ = cheerio.load(content);
        
        const sectionUrls = Array
                            .from($('._17BF0 ._3OHLp > div a'))
                            .map(elem => `${baseUrl}${$(elem).attr('href')}`);
        console.log(sectionUrls);
        const data = JSON.stringify(sectionUrls);
        fs.writeFileSync('sectionUrls.json', data);
        // for (url of sectionUrls) {
        //     const expertsListPage = await browser.newPage();
        //     await browser.goto(link);
        //     await expertsList.waitForSelector('_12oDh');
        //     let content = await page.content();
        //     const $ = cheerio.load(content)
        //     const nextButton = $('.Polaris-Pagination__Button.Polaris-Pagination__NextButton').disabled
        //     expertsUrls.concat()
        // }

        //this checks is the "next page" button is disabled - if it is, we are on the last page
        //const nextButton = $('button.Polaris-Pagination__Button.Polaris-Pagination__NextButton').prop("disabled")
        
        //console.log(nextButton)
        await browser.close()
    } catch (e) {
        console.log(`our error: ${e}`)
    }
})()
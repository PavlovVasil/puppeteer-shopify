const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const saveUrlsToFile = async (urls = [], fName = "default.json") => {
    await fs.writeFile(fName, JSON.stringify({
        urls: urls
    }));
}

/*This function expects a url for a given section with Shopify experts and scrapes their details pages urls.
We don't have a real pagination, because there is no indication of the number of all pages, only "prev" and "next buttons".
Also the "next" button does not have a url that could use. So we have to construct the urls by checking
if it is disabled or not instead.*/
const getExpertUrlsForSection = async (baseUrl, sectionUrl, browser) => {
    const expertUrls = [];
    const browserTab = await browser.newPage();
    await browserTab.goto(sectionUrl);
    await browserTab.waitForSelector('.kVWrj');
    const content = await browserTab.content();
    const $ = cheerio.load(content);
    expertUrls.push(...Array.from($('.kVWrj a')).map(a => `${baseUrl}${$(a).prop('href')}`));
    
    //if the nextButton is disabled, we are on the last page of this section
    let nextButton = !$('.Polaris-Pagination__Button.Polaris-Pagination__NextButton').prop('disabled');
    let nextPageQuery = "?page=";
    // start from 2, because the first page does not have a query string 
    let i = 2;
    //Go to the next page and get the experts urls, until we don't have a "next" button 
    while (nextButton) {
        //construct the next page url, but use a single tab for all the pages we are about to scrape
        const nextPageUrl = `${sectionUrl}${nextPageQuery}${i}`;
        await browserTab.goto(nextPageUrl);
        await browserTab.waitForSelector('.kVWrj');
        const content = await browserTab.content();
        const $ = cheerio.load(content);
        expertUrls.push(...Array.from($('.kVWrj a')).map(a => `${baseUrl}${$(a).prop('href')}`));
        nextButton = !$('.Polaris-Pagination__Button.Polaris-Pagination__NextButton').prop('disabled');
        i++;
    }
    await browserTab.close();
    return expertUrls;
}

(async () => {
    try {
        const baseUrl = 'https://experts.shopify.com';
        //const baseSectionUrl = 'https://experts.shopify.com/services/visual-content-and-branding/develop-brand-look-and-feel';
        const allExperts = [];
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        await page.goto(baseUrl);
        let content = await page.content();
        const $ = cheerio.load(content);

        //get all the section urls
        const sectionUrls = Array.from($('._17BF0 ._3OHLp > div a')).map(elem => `${baseUrl}${$(elem).attr('href')}`);
        for (const sectionUrl of sectionUrls) {
            //get all the experts details pages urls for the current section
            const expertsForSection = await getExpertUrlsForSection(baseUrl, sectionUrl, browser);
            allExperts.push(...expertsForSection);
        }
        await saveUrlsToFile(allExperts, 'allExperts.json');
        await browser.close();
    } catch (e) {
        console.log(`our error: ${e}`);
    }
})()
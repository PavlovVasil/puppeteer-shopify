const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const saveUrlsToFile = async (urls = [], fName = "default.json") => {
    await fs.writeFile(fName, JSON.stringify({
        urls: urls
    }));
}

const getExpertUrlsForSection = async (baseUrl, sectionUrl, browser) => {
    const expertUrls = [];
    const browserTab = await browser.newPage();
    await browserTab.goto(sectionUrl);
    await browserTab.waitForSelector('.kVWrj');
    const content = await browserTab.content();
    const $ = cheerio.load(content);
    expertUrls.push(...Array.from($('.kVWrj a')).map(a => `${baseUrl}${$(a).prop('href')}`));

    //let test = $('.Polaris-Pagination__Button.Polaris-Pagination__NextButton').prop('disabled');
    
    //if the nextButton is disabled, we are on the last page of this section
    let nextButton = !$('.Polaris-Pagination__Button.Polaris-Pagination__NextButton').prop('disabled');
    let nextPageQuery = "?page=";
    let i = 2;
    //Go to the next page and get the experts urls, until we don't have a "next" button 
    while (nextButton) {
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
        const baseSectionUrl = 'https://experts.shopify.com/services/visual-content-and-branding/develop-brand-look-and-feel';

        const browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        await page.goto(baseUrl);
        let content = await page.content();
        const $ = cheerio.load(content);

        //get the section urls
        const sectionUrls = Array.from($('._17BF0 ._3OHLp > div a')).map(elem => `${baseUrl}${$(elem).attr('href')}`);
        //await saveUrlsToFile(sectionUrls, 'sectionUrls.json');


        const expertsForSection = await getExpertUrlsForSection(baseUrl, baseSectionUrl, browser);
        await saveUrlsToFile(expertsForSection, 'sectionExpertsUrls.json');
        await browser.close();
    } catch (e) {
        console.log(`our error: ${e}`);
    }
})()
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const Database = require('sqlite-async');

// call this if you have an array of urls and want to save then as a JSON file
const saveUrlsToFile = async (urls = [], fName = "default.json") => {
    await fs.writeFile(fName, JSON.stringify({
        urls: urls
    }));
}

/*Scrape the experts details pages for a given section from its url
We don't have a real pagination, because there is no indication of the number of all pages, only "prev" and "next buttons".
Also the "next" button does not have a url that we could use. Instead, we have to construct the urls by checking
if the next page button is disabled or not.*/
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
        //construct the next page url and use a single tab for all the page urls we are about to scrape
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

// Extract the details for a given expert from the details page
const getExpertDetails = async (url, browser) => {
    const details = {
        url: url,
        name: '',
        location: '',
        languages: '',
        about: '',
        section: '',
        startingPrice: 0,
        jobsCompleted: 0,
        rating: 0,
        includedInPrice: '',
        additionalPriceInfo: ''
    };
    const browserTab = await browser.newPage();
    await browserTab.goto(url);
    await browserTab.waitForSelector('._1TKSp .Polaris-DisplayText.Polaris-DisplayText--sizeLarge');

    const content = await browserTab.content();
    const $ = cheerio.load(content);
    details.name = $('._2tuj_ ._2MboN a').text();
    details.location = $('._3n3J7 ._3UyXZ .iec8d span').text();
    details.languages = $('._3n3J7 ._3trYk ._324Yr > .iec8d span').text();
    // Checking if the div containing the "(+ n more)" languages text exists - if it does, we have a tooltip to hover
    if ($('._2gIX3').length > 0) {
        await browserTab.hover('._3n3J7 ._3trYk ._324Yr > .iec8d span');
        await browserTab.waitForSelector('.Polaris-Tooltip__Label');
        // The DOM structure changes after the hover so we have to pass the new HTML to Cheerio.
        const newContent = await browserTab.content()
        const _$ = cheerio.load(newContent);
        const otherLanguages = _$('.Polaris-Tooltip__Label').text();
        details.languages = `${details.languages}, ${otherLanguages}`;
    }
    details.about = $('._3HKB3 ._3xhwh p').text();
    details.section = $('.HYncG h2').text();
    // Getting only numbers from the "price" string by using regex and converting the resulting array into a new string to pass to parseInt()
    details.startingPrice = parseInt(
        $('.HYncG .eB8wo .YFs8N:nth-child(1) ._3657d').text().match(/\d/g).join(""), 10);
    details.jobsCompleted = parseInt(
        $('.HYncG .eB8wo .YFs8N:nth-child(2) ._3657d .Polaris-Stack__Item:nth-child(2)').text(), 10);
    // Unfortunately the DOM structure is very nested and does not allow the usage of more concise CSS selectors
    details.rating = parseFloat(
        $('.HYncG .eB8wo .YFs8N:nth-child(3) ._3657d .Polaris-Stack__Item:nth-child(2) .Polaris-Stack__Item:nth-child(1)').text());
    details.includedInPrice = $('.cGBf6 .Polaris-TextContainer:nth-child(1) pre').text();
    details.additionalPriceInfo = $('.cGBf6 .Polaris-TextContainer:nth-child(2) pre').text();
    browserTab.close();
    return details;
}

(async () => {
    const DB_PATH = './db/experts.db';
    const db = await Database.open(DB_PATH);
    try {
        const dbSchema = `CREATE TABLE IF NOT EXISTS experts (
            id INTEGER NOT NULL PRIMARY KEY,
            url TEXT NOT NULL,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            languages TEXT NOT NULL,
            about TEXT NOT NULL,
            starting_price INTEGER NOT NULL,
            jobs_completed INTEGER NOT NULL,
            rating REAL NOT NULL,
            included_in_price TEXT NOT NULL,
            additional_price_info TEXT NOT NULL
        );`
        await db.run(dbSchema);
    } catch (error) {
        throw Error(`cannot access the database: ${error}`)
    }
    try {
        const baseUrl = 'https://experts.shopify.com';
        //const baseSectionUrl = 'https://experts.shopify.com/services/visual-content-and-branding/develop-brand-look-and-feel';
        const expertDetailsUrl = 'https://experts.shopify.com/codevibez/customize-design';
        const allExperts = [];
        const browser = await puppeteer.launch({
            headless: false
        });
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36');
        await page.goto(baseUrl);
        // let content = await page.content();
        // const $ = cheerio.load(content);

        // //get all the section urls
        // const sectionUrls = Array.from($('._17BF0 ._3OHLp > div a')).map(elem => `${baseUrl}${$(elem).attr('href')}`);
        // for (const sectionUrl of sectionUrls) {
        //     //get all the experts details pages urls for the current section
        //     const expertsForSection = await getExpertUrlsForSection(baseUrl, sectionUrl, browser);
        //     allExperts.push(...expertsForSection);
        // }
        // await saveUrlsToFile(allExperts, 'allExperts.json');

        const details = await getExpertDetails(expertDetailsUrl, browser);
        const {
            url,
            name,
            location,
            languages,
            about,
            startingPrice,
            jobsCompleted,
            rating,
            includedInPrice,
            additionalPriceInfo
        } = details
        console.log(details)
        try {
            await db.run(`INSERT INTO experts (
                url, 
                name, 
                location, 
                languages, 
                about, 
                starting_price, 
                jobs_completed, 
                rating, 
                included_in_price, 
                additional_price_info) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                url,
                name,
                location,
                languages,
                about,
                startingPrice,
                jobsCompleted,
                rating,
                includedInPrice,
                additionalPriceInfo)
        } catch (error) {
            throw Error(error);
        }
        await browser.close();
    } catch (error) {
        console.log(`our error: ${error}`);
    }
})()
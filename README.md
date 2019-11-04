# puppeteer-shopify

A web scraper for educational purposes, built with Node.js, Puppeteer and Cheerios.

### How to run the scraper

You would need Node.js version 12 or above installed on your system.
Navigate to the root folder and then use these commands: 

1. Install the dependencies: ```npm i```
2. Run the scraper: ```npm run scraper```

### Details

Shopify provides you the option to hire some experts to help you with you online shop. 
The scraper goes to [the experts landing page](https://experts.shopify.com), and the does the following: 

1. Gets all the 16 (at the moment) sections with experts
2. Goes to each section and gets the links for the detail pages of all experts in the section
3. If there are more than one page with links for the section, it iterates all of them in order to get all expert detail pages for the current section
4. Saves all detail url in a JSON file (for later usage)
5. Iterates over all detail pages (currently around 2200) and gets details for the given expert: 
    1. Name of the expert(or company)
    2. Location
    3. Contact languages
    4. About
    5. Section (under which the expert has listed his services)
    6. Starting Price
    7. Jobs Completed
    8. User Rating
    9. What is included in the price
    10. Additional work and price information
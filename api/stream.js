const axios = require('axios');
const puppeteer = require('puppeteer-core'); // Using core for Vercel compatibility
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) throw new Error('Missing video ID');

    // Method 1: Try direct API first (least likely to be blocked)
    try {
      const apiUrl = `https://www.terabox.com/api/shorturlinfo?app_id=250528&shorturl=${id}`;
      const { data: apiData } = await axios.get(apiUrl, {
        headers: {
          'Referer': 'https://www.terabox.com/',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (apiData?.dlink) {
        return res.json({
          status: true,
          url: apiData.dlink,
          method: 'direct_api'
        });
      }
    } catch (e) {}

    // Method 2: Headless browser fallback
    let browser;
    try {
      browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
      
      await page.goto(`https://www.terabox.com/sharing/link?surl=${id}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for video element to load
      await page.waitForSelector('video', { timeout: 5000 });
      
      const videoUrl = await page.evaluate(() => {
        return document.querySelector('video source')?.src || 
               window.pageData?.file_list?.[0]?.dlink;
      });

      if (videoUrl) {
        return res.json({
          status: true,
          url: videoUrl,
          method: 'puppeteer'
        });
      }
    } finally {
      if (browser) await browser.close();
    }

    // Method 3: Legacy fallback
    try {
      const { data } = await axios.get(`https://www.terabox.com/sharing/link?surl=${id}`, {
        headers: {
          'Cookie': 'ndut_fmt=1; lang=en',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36'
        }
      });

      const $ = cheerio.load(data);
      const videoUrl = $('meta[property="og:video:secure_url"]').attr('content') || 
                      $('video source').attr('src');

      if (videoUrl) {
        return res.json({
          status: true,
          url: videoUrl,
          method: 'legacy_scrape'
        });
      }
    } catch (e) {}

    throw new Error('All extraction methods exhausted');

  } catch (error) {
    res.status(500).json({
      status: false,
      error: "Extraction failed",
      details: error.message,
      tip: "Try again later or use official app"
    });
  }
};

const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Step 1: Fetch with mobile headers (bypasses bot detection)
    const { data } = await axios.get(`https://www.terabox.com/sharing/link?surl=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.terabox.com/'
      }
    });

    // Step 2: New extraction method
    const $ = cheerio.load(data);
    const scriptContent = $('script:contains("pageData")').html();
    
    // Modern JSON-based extraction
    const jsonMatch = scriptContent.match(/window\.pageData\s*=\s*({.+?});/);
    if (!jsonMatch) throw new Error('pageData not found');
    
    const pageData = JSON.parse(jsonMatch[1]);
    const videoUrl = pageData?.file_list?.[0]?.dlink;
    
    if (!videoUrl) throw new Error('Video URL not in pageData');

    // Step 3: Return direct URL
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      status: true,
      url: videoUrl
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      error: "Extraction failed",
      details: error.message,
      tip: "Try again or check TeraBox updates"
    });
  }
};

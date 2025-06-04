const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Step 1: Fetch the TeraBox page with proper headers
    const { data } = await axios.get(`https://www.terabox.com/sharing/link?surl=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    // Step 2: New extraction method (works as of July 2024)
    const $ = cheerio.load(data);
    const scriptContent = $('script:contains("video_url")').html();
    
    // Modern regex pattern
    const videoUrlMatch = scriptContent.match(/video_url["']:\s*["'](https?:\/\/[^"']+\.mp4)/);
    
    if (!videoUrlMatch) {
      throw new Error('Video URL not found in page');
    }

    // Step 3: Return the direct URL
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      status: true,
      url: videoUrlMatch[1].replace(/\\\//g, '/')
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      error: "Extraction failed",
      details: error.message,
      tip: "TeraBox may have updated their page structure"
    });
  }
};

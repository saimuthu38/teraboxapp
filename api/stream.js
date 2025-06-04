const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) throw new Error('Missing video ID');

    // Step 1: Fetch with rotating headers
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.terabox.com/',
      'Cookie': 'ndut_fmt=1;' // Bypass mobile redirect
    };

    const { data } = await axios.get(`https://www.terabox.com/sharing/link?surl=${id}`, { headers });

    // Step 2: Try 3 extraction methods
    let videoUrl = null;
    
    // Method 1: JSON data extraction (newest)
    const jsonMatch = data.match(/window\.pageData\s*=\s*({.+?});/s);
    if (jsonMatch) {
      try {
        const pageData = JSON.parse(jsonMatch[1]);
        videoUrl = pageData?.file_list?.[0]?.dlink;
      } catch (e) {}
    }

    // Method 2: Legacy variable extraction
    if (!videoUrl) {
      const varMatch = data.match(/video_url["']:\s*["'](https?:\/\/[^"']+\.mp4)/);
      videoUrl = varMatch?.[1];
    }

    // Method 3: Cheerio fallback
    if (!videoUrl) {
      const $ = cheerio.load(data);
      videoUrl = $('meta[property="og:video:url"]').attr('content') || 
                 $('video source').attr('src');
    }

    if (!videoUrl) throw new Error('All extraction methods failed');

    // Step 3: Return success
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      status: true,
      url: videoUrl.replace(/\\\//g, '/')
    });

  } catch (error) {
    res.status(500).json({
      status: false,
      error: "Extraction failed",
      details: error.message,
      tip: "TeraBox may have updated their anti-scraping measures"
    });
  }
};

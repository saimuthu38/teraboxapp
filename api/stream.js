const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Step 1: Fetch TeraBox page
    const teraboxUrl = `https://www.terabox.com/sharing/link?surl=${id}`;
    const { data } = await axios.get(teraboxUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
      }
    });

    // Step 2: Extract video URL (modern method)
    const videoUrl = data.match(/video_url["']:\s*["']([^"']+)/)[1];
    
    // Step 3: Return direct URL
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ 
      status: true,
      url: videoUrl.replace(/\\\//g, '/')
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: "Extraction failed",
      details: error.message
    });
  }
};

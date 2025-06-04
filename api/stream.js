const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;
    
    // Step 1: Call TeraBox's internal API
    const apiResponse = await axios.get(`https://www.terabox.com/api/shorturlinfo?app_id=250528&shorturl=${id}`, {
      headers: {
        'Referer': 'https://www.terabox.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10-second timeout
    });

    // Step 2: Extract direct URL
    const videoUrl = apiResponse.data?.dlink;
    if (!videoUrl) throw new Error('No URL found in API response');

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
      tip: "Try again or contact support"
    });
  }
};

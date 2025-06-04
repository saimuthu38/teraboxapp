export default async (req, res) => {
  const { id } = req.query;
  
  try {
    // Step 1: Fetch TeraBox page
    const teraboxUrl = `https://www.terabox.com/sharing/link?surl=${id}`;
    const { data } = await fetch(teraboxUrl).then(r => r.text());
    
    // Step 2: Extract video URL (simplified)
    const videoUrl = data.match(/video_url":"([^"]+)"/)[1];
    
    // Step 3: Return direct URL
    return res.json({ 
      status: true,
      url: videoUrl.replace(/\\\//g, '/')
    });
  } catch (error) {
    return res.json({ 
      status: false,
      error: "Video extraction failed"
    });
  }
};

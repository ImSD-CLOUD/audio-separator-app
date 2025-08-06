const fetch = require('node-fetch');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Only POST method is allowed' })
    };
  }

  try {
    const { fileUrl, model } = JSON.parse(event.body);

    if (!fileUrl || !model) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileUrl or model' })
      };
    }

    // 🔁 Trigger Replicate API with split option
    const replicateRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: model,
        input: {
          audio: fileUrl,
          split: "vocals"  // ✅ Only return vocals + instrumental
        }
      })
    });

    const replicateData = await replicateRes.json();

    if (replicateData.error) {
      throw new Error(replicateData.error);
    }

    // 🕒 Wait for processing to complete
    let prediction;
    const predictionUrl = replicateData.urls.get;
    while (true) {
      const pollRes = await fetch(predictionUrl, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      });
      prediction = await pollRes.json();

      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (prediction.status !== 'succeeded') {
      throw new Error('Replicate prediction failed');
    }

    // 🎵 Upload both files to Cloudinary
    const [vocalUrl, instrumentalUrl] = prediction.output;

    const uploadedVocal = await cloudinary.uploader.upload(vocalUrl, { folder: 'audio-separator' });
    const uploadedInstrumental = await cloudinary.uploader.upload(instrumentalUrl, { folder: 'audio-separator' });

    return {
      statusCode: 200,
      body: JSON.stringify({
        vocal: uploadedVocal.secure_url,
        instrumental: uploadedInstrumental.secure_url
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Audio separation failed.' })
    };
  }
};

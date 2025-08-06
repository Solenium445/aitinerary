// places-server.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.get('/places', async (req, res) => {
  const { destination, category } = req.query;
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  const query = `${destination} ${category}`;

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching places:', err);
    res.status(500).json({ error: 'Failed to fetch from Google Places' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Places API server is running on http://localhost:${PORT}`);
});


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { MongoClient } from 'mongodb';

// MongoDB configuration
const MONGO_URI = 'mongodb://localhost:27017/mutual_funds';
const DB_NAME = 'mutual_funds';
const COLLECTION_NAME = 'active_schemes';
let mongoClient = null;

// Initialize MongoDB client (singleton to avoid multiple connections)
async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await mongoClient.connect();
    console.log('MongoDB connected');
  }
  return mongoClient;
}

// Function to update MongoDB with active schemes
async function updateActiveSchemesInMongo() {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const response = await fetch('https://api.mfapi.in/mf');
    const schemes = await response.json();
    const activeSchemes = schemes.filter(s => s.isinGrowth);

    console.log('Active schemes:', activeSchemes.length);

    const delay = ms => new Promise(res => setTimeout(res, ms));
    const batchSize = 100; // insert 100 at a time
    let batchData = [];

    for (let i = 0; i < activeSchemes.length; i++) {
      const scheme = activeSchemes[i];

      try {
        const schemeResponse = await fetch(`https://api.mfapi.in/mf/${scheme.schemeCode}`);
        if (!schemeResponse.ok) continue;

        const { data: navHistory } = await schemeResponse.json();
        if (!Array.isArray(navHistory) || navHistory.length === 0) continue;

        const navValue = parseFloat(navHistory[0].nav);
        if (isNaN(navValue) || navValue <= 0) continue;

        batchData.push({
          id: scheme.schemeCode,
          name: scheme.schemeName,
          nav: navValue,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.warn(`Error fetching NAV for ${scheme.schemeCode}: ${err.message}`);
      }

      // Insert batch every 100 items or at the end
      if (batchData.length === batchSize || i === activeSchemes.length - 1) {
        if (i < batchSize) {
          await collection.deleteMany({}); // clear old data before first batch
        }
        await collection.insertMany(batchData);
        console.log(`Inserted batch: ${batchData.length} schemes (processed ${i + 1}/${activeSchemes.length})`);
        batchData = [];
      }

      await delay(50); // small delay to avoid API overload
    }

    console.log('MongoDB update completed for all active schemes');
  } catch (error) {
    console.error('Failed to update MongoDB:', error);
  }
}


// Schedule cron job for 7:00 AM IST (1:30 AM UTC, since IST is UTC+5:30)
cron.schedule('30 1 * * *', async () => {
  console.log('Running cron job to update active schemes in MongoDB');
  await updateActiveSchemesInMongo();
}, {
  timezone: 'Asia/Kolkata',
});

// Run once on server start for testing
updateActiveSchemesInMongo();

(async () => {
  console.log('Running initial MongoDB update...');
  await updateActiveSchemesInMongo();
})();

export async function GET() {
  const cacheFile = path.join(process.cwd(), 'activeSchemes.json');

  try {
    // Try to read from cache
    const cachedData = await fs.readFile(cacheFile, 'utf8').catch(() => null);
    if (cachedData) {
      const schemes = JSON.parse(cachedData);
      if (Array.isArray(schemes) && schemes.length > 0) {
        console.log('Serving from cache, active schemes:', schemes.length);
        return NextResponse.json(schemes, {
          headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
        });
      }
    }

    // Fetch and filter schemes
    const response = await fetch('https://api.mfapi.in/mf', {
      cache: 'force-cache',
    });

    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch schemes' }, { status: 500 });
    }

    const schemes = await response.json();

    if (!Array.isArray(schemes)) {
      console.error('Expected an array from API, got:', typeof schemes, schemes);
      return NextResponse.json({ error: 'Invalid API response: schemes is not an array' }, { status: 500 });
    }

    console.log('Total schemes fetched:', schemes.length);

    // Filter active schemes
    const activeSchemes = schemes.filter((scheme) => {
      const isActive = scheme.isinGrowth !== null && scheme.isinGrowth !== '';
      if (!isActive) {
        console.warn(`Scheme ${scheme.schemeCode} inactive, isinGrowth: ${scheme.isinGrowth}`);
      }
      return isActive;
    });

    console.log('Active schemes after filtering:', activeSchemes.length);

    if (activeSchemes.length === 0) {
      return NextResponse.json({ error: 'No active schemes found' }, { status: 404 });
    }

    // Save to cache
    await fs.writeFile(cacheFile, JSON.stringify(activeSchemes)).catch((err) => {
      console.error('Failed to write cache:', err);
    });

    return NextResponse.json(activeSchemes, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Internal server error in /api/mf:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



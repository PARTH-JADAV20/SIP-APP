import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'mutual_funds';
let mongoClient = null;

async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection('watchlist');

    const userId = 'dummyUser';

    const userWatchlistDoc = await collection.findOne({ userId });

    const items = userWatchlistDoc ? userWatchlistDoc.items : [];

    const results = await Promise.all(
      items.map(async (item) => {
        const res = await fetch(`http://localhost:3000/api/scheme/${item.scheme_code}`);
        const schemeData = await res.json();
        const navHistory = (schemeData.navHistory || []).map(d => ({ date: d.date, nav: parseFloat(d.nav) }));
        
        return {
          schemeCode: item.scheme_code,
          name: schemeData.metadata.scheme_name,
          fundHouse: schemeData.metadata.fund_house,
          category: schemeData.metadata.scheme_category,
          navHistory
        };
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

// POST
export async function POST(req) {
  try {
    const { scheme_code } = await req.json();
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection('watchlist');

    const userId = 'dummyUser';
    
    // ⭐ CHANGE 2: Find the user's document, and use $addToSet 
    // to push the new scheme object into the 'items' array.
    // $addToSet ensures no duplicate scheme_codes are added.
    await collection.updateOne(
      { userId }, // Only query by userId
      { 
        $addToSet: { 
          items: { scheme_code: scheme_code, addedAt: new Date() } 
        } 
      },
      { upsert: true } // Creates the document if it doesn't exist
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req) {
  try {
    const { scheme_code } = await req.json();
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection('watchlist');

    const userId = 'dummyUser';
    
    // ⭐ CHANGE 3: Find the user's document, and use $pull 
    // to remove the specific scheme object from the 'items' array.
    await collection.updateOne(
      { userId }, // Only query by userId
      { 
        $pull: { 
          items: { scheme_code: scheme_code } // Pull the item that matches the scheme_code
        } 
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
  }
}
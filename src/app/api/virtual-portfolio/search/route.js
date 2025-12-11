// app/api/virtual-portfolio/search/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();
    
    // Search for matching funds (adjust the query as needed)
    const funds = await db
      .collection('mutualFunds')
      .find({
        $or: [
          { schemeName: { $regex: query, $options: 'i' } },
          { schemeCode: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10)
      .toArray();

    await client.close();
    return NextResponse.json(funds, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search funds' },
      { status: 500 }
    );
  }
}
// app/api/virtual-portfolio/[id]/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    const portfolio = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    // Convert ObjectId to string for the response
    portfolio._id = portfolio._id.toString();
    
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio', details: error.message }, 
      { status: 500 }
    );
  }
}
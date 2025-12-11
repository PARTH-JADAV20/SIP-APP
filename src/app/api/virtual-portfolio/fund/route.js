// app/api/virtual-portfolio/fund/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function POST(request) {
  // Add a fund to portfolio (no transaction executed, just register)
  try {
    const body = await request.json();
    const { portfolioId, schemeCode, fundName, investmentType = 'SIP', amount, frequency = 'monthly', startDate } = body;
    if (!portfolioId || !schemeCode || !fundName || !amount) return NextResponse.json({ error: 'missing' }, { status: 400 });

    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    const fundObj = {
      fundId: String(schemeCode), // or uuid
      schemeCode,
      fundName,
      investmentType,
      amount,
      frequency,
      startDate: startDate || new Date().toISOString().slice(0,10),
      transactions: [],
      totalUnits: 0,
      totalInvested: 0,
      createdAt: new Date()
    };

    await collection.updateOne(
      { _id: new ObjectId(portfolioId) },
      { $push: { funds: fundObj }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, fund: fundObj });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to add fund' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { portfolioId, fundId } = await request.json();
    if (!portfolioId || !fundId) return NextResponse.json({ error: 'missing' }, { status: 400 });

    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    await collection.updateOne(
      { _id: new ObjectId(portfolioId) },
      { $pull: { funds: { fundId } }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to remove fund' }, { status: 500 });
  }
}

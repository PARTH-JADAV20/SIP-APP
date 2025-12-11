import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

async function fetchLatestNAV(schemeCode) {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) throw new Error('scheme not found');
  const json = await res.json();
  if (!json.data?.length) throw new Error('no nav');
  const latest = json.data[0];
  return { nav: parseFloat(latest.nav), date: latest.date };
}

export async function POST(request) {
  try {
    const { portfolioId, fundId, schemeCode, amount } = await request.json();
    if (!portfolioId || !schemeCode || !amount)
      return NextResponse.json({ error: 'missing' }, { status: 400 });

    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    // fetch latest NAV
    const { nav, date } = await fetchLatestNAV(schemeCode);
    const units = amount / nav;

    const portfolio = await collection.findOne({ _id: new ObjectId(portfolioId) });
    if (!portfolio) return NextResponse.json({ error: 'portfolio not found' }, { status: 404 });
    if (portfolio.balance < amount)
      return NextResponse.json({ error: 'insufficient virtual balance' }, { status: 400 });

    // Use MongoDB $ operators to directly update the nested fund
    const result = await collection.updateOne(
      { _id: new ObjectId(portfolioId), "funds.fundId": String(fundId) },
      {
        $push: {
          "funds.$.transactions": { type: "BUY", date, nav, units, amount }
        },
        $inc: {
          "funds.$.totalUnits": units,
          "funds.$.totalInvested": amount,
          balance: -amount
        },
        $set: { updatedAt: new Date() }
      }
    );

    if (!result.modifiedCount)
      return NextResponse.json({ error: "Fund not found in portfolio" }, { status: 404 });

    return NextResponse.json({ success: true, nav, units });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "buy failed" }, { status: 500 });
  }
}

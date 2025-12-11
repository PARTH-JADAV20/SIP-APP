// app/api/virtual-portfolio/sell/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

async function fetchLatestNAV(schemeCode) {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) throw new Error('scheme not found');
  const json = await res.json();
  const data = json.data;
  if (!data || !data.length) throw new Error('no nav');
  const latest = data[0];
  return { nav: parseFloat(latest.nav), date: latest.date };
}

export async function POST(request) {
  try {
    const { portfolioId, fundId, schemeCode, unitsToSell } = await request.json();
    if (!portfolioId || !schemeCode || !unitsToSell) return NextResponse.json({ error: 'missing' }, { status: 400 });

    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    const portfolio = await collection.findOne({ _id: new ObjectId(portfolioId) });
    if (!portfolio) return NextResponse.json({ error: 'portfolio not found' }, { status: 404 });

    let found = null;
    portfolio.funds.forEach(f => { if (f.fundId === String(fundId) || String(f.schemeCode) === String(schemeCode)) found = f; });

    if (!found) return NextResponse.json({ error: 'fund not found' }, { status: 404 });

    if ((found.totalUnits || 0) < unitsToSell) return NextResponse.json({ error: 'not enough units' }, { status: 400 });

    // get NAV
    const navRes = await fetchLatestNAV(schemeCode);
    const nav = navRes.nav;
    const date = navRes.date;
    const sellAmount = unitsToSell * nav;

    // update fund: reduce units and totalInvested? (we keep invested as historical)
    const updatedFunds = portfolio.funds.map(f => {
      if (f.fundId === String(fundId) || String(f.schemeCode) === String(schemeCode)) {
        f.transactions = f.transactions || [];
        f.transactions.push({ date, nav, units: unitsToSell, type: 'sell' });
        f.totalUnits = (f.totalUnits || 0) - unitsToSell;
        // optionally adjust totalInvested (we'll leave totalInvested as historical money invested)
      }
      return f;
    });

    await collection.updateOne(
      { _id: new ObjectId(portfolioId) },
      { $set: { funds: updatedFunds, balance: portfolio.balance + sellAmount, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, sellAmount, nav });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'sell failed' }, { status: 500 });
  }
}

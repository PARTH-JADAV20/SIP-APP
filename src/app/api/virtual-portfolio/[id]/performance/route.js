// app/api/virtual-portfolio/[id]/performance/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

async function fetchLatestNAV(schemeCode) {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!res.ok) throw new Error('scheme not found');
  const json = await res.json();
  const latest = json.data && json.data[0];
  if (!latest) throw new Error('no nav');
  return { nav: parseFloat(latest.nav), date: latest.date };
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    const portfolio = await collection.findOne({ _id: new ObjectId(id) });
    if (!portfolio) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const funds = await Promise.all(portfolio.funds.map(async (f) => {
      try {
        const { nav } = await fetchLatestNAV(f.schemeCode);
        const currentValue = (f.totalUnits || 0) * nav;
        const invested = f.totalInvested || 0;
        const simpleReturn = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
        return {
          fundId: f.fundId,
          schemeCode: f.schemeCode,
          fundName: f.fundName,
          totalUnits: f.totalUnits,
          latestNAV: nav,
          totalInvested: invested,
          currentValue,
          simpleReturn: Number(simpleReturn.toFixed(2))
        };
      } catch (e) {
        console.error('fund nav error', f.schemeCode, e);
        return {
          fundId: f.fundId,
          schemeCode: f.schemeCode,
          fundName: f.fundName,
          error: 'nav fetch failed'
        };
      }
    }));

    const totalInvested = funds.reduce((s, f) => s + (f.totalInvested || 0), 0);
    const totalCurrent = funds.reduce((s, f) => s + (f.currentValue || 0), 0);
    const portfolioReturn = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

    return NextResponse.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.portfolioName,
      balance: portfolio.balance,
      funds,
      summary: {
        totalInvested,
        totalCurrent,
        portfolioReturn: Number(portfolioReturn.toFixed(2))
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

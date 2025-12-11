// app/api/portfolio/analytics/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    
    if (!portfolioId) {
      return NextResponse.json(
        { error: 'portfolioId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const portfolio = await db.collection('virtual_portfolio').findOne({
      _id: new ObjectId(portfolioId)
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Calculate portfolio value over time
    const valueOverTime = [];
    const transactionsByDate = {};

    // Group transactions by date
    portfolio.transactions.forEach(tx => {
      const date = new Date(tx.date).toISOString().split('T')[0];
      if (!transactionsByDate[date]) {
        transactionsByDate[date] = [];
      }
      transactionsByDate[date].push(tx);
    });

    // Sort dates
    const sortedDates = Object.keys(transactionsByDate).sort();
    
    // Calculate portfolio value for each day with transactions
    let runningBalance = 0;
    let runningValue = 0;
    const fundHistory = {};

    for (const date of sortedDates) {
      const txs = transactionsByDate[date];
      
      for (const tx of txs) {
        if (tx.type === 'DEPOSIT') {
          runningBalance += tx.amount;
        } else if (tx.type === 'WITHDRAWAL') {
          runningBalance -= tx.amount;
        } else if (tx.type === 'SIP' || tx.type === 'ONE_TIME') {
          runningBalance -= tx.amount;
          
          if (!fundHistory[tx.schemeCode]) {
            fundHistory[tx.schemeCode] = {
              units: 0,
              schemeName: tx.schemeName
            };
          }
          
          fundHistory[tx.schemeCode].units += tx.units;
        }
      }

      // Calculate current value based on NAVs at this date
      let currentValue = 0;
      const fundValues = await Promise.all(
        Object.entries(fundHistory).map(async ([schemeCode, fund]) => {
          // Get NAV for this date (simplified - in reality you'd need historical NAV data)
          const navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
          if (!navResponse.ok) return 0;
          const navData = await navResponse.json();
          const nav = parseFloat(navData.data[0]?.nav || 0);
          return fund.units * nav;
        })
      );

      currentValue = fundValues.reduce((sum, val) => sum + val, 0) + runningBalance;
      runningValue = currentValue;

      valueOverTime.push({
        date,
        value: currentValue,
        invested: runningBalance
      });
    }

    // Calculate asset allocation
    const assetAllocation = await Promise.all(
      Object.entries(fundHistory).map(async ([schemeCode, fund]) => {
        const navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
        if (!navResponse.ok) return null;
        const navData = await navResponse.json();
        const nav = parseFloat(navData.data[0]?.nav || 0);
        const value = fund.units * nav;
        return {
          schemeCode,
          schemeName: fund.schemeName,
          units: fund.units,
          nav,
          value
        };
      })
    ).then(results => results.filter(Boolean));

    const totalValue = assetAllocation.reduce((sum, asset) => sum + asset.value, 0) + runningBalance;

    return NextResponse.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.portfolioName,
      valueOverTime,
      assetAllocation: [
        ...assetAllocation.map(asset => ({
          ...asset,
          percentage: (asset.value / totalValue) * 100
        })),
        {
          schemeName: 'Cash',
          value: runningBalance,
          percentage: (runningBalance / totalValue) * 100
        }
      ],
      totalValue,
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error('Error fetching portfolio analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio analytics', details: error.message },
      { status: 500 }
    );
  }
}
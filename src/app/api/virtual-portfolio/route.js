// app/api/virtual-portfolio/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const db = await getDb();
    const collection = db.collection('virtual_portfolio');

    const userId = 'dummyUser'; // replace with auth
    const portfolios = await collection.find({ userId }).toArray();
    return NextResponse.json(portfolios.map(p => ({
      ...p,
      _id: p._id.toString()
    })));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { portfolioName, startingBalance = 100000, initialInvestment } = await request.json();

    if (!portfolioName) {
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = 'dummyUser'; // Replace with actual user ID when auth is implemented

    const portfolioData = {
      userId,
      portfolioName,
      balance: parseFloat(startingBalance),
      funds: [],
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add initial investment if provided
    if (initialInvestment) {
      const { schemeCode, schemeName, amount } = initialInvestment;
      const navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      if (!navResponse.ok) throw new Error('Failed to fetch NAV');
      const navData = await navResponse.json();
      const currentNav = parseFloat(navData.data[0].nav);
      const units = amount / currentNav;

      portfolioData.funds.push({
        schemeCode,
        schemeName,
        units,
        averageNav: currentNav,
        investedAmount: amount,
        currentValue: amount,
        lastUpdated: new Date()
      });

      portfolioData.transactions.push({
        type: 'INITIAL_INVESTMENT',
        amount,
        schemeCode,
        schemeName,
        units,
        nav: currentNav,
        date: new Date(),
        status: 'COMPLETED'
      });

      // Deduct from balance
      portfolioData.balance -= amount;
    }

    const result = await db.collection('virtual_portfolio').insertOne(portfolioData);

    return NextResponse.json({
      _id: result.insertedId,
      ...portfolioData
    });

  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio', details: error.message },
      { status: 500 }
    );
  }
}

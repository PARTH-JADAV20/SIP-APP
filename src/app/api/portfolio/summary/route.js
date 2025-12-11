// app/api/portfolio/summary/route.js
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

    // Calculate summary
    const totalInvested = portfolio.funds.reduce((sum, fund) => sum + fund.investedAmount, 0);
    const currentValue = portfolio.funds.reduce((sum, fund) => sum + fund.currentValue, 0);

    return NextResponse.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.portfolioName,
      totalInvested,
      currentValue,
      totalReturn: currentValue - totalInvested,
      returnPercentage: (currentValue - totalInvested) / totalInvested * 100,
      funds: portfolio.funds.map(fund => ({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        units: fund.units,
        averageNav: fund.averageNav,
        investedAmount: fund.investedAmount,
        currentValue: fund.currentValue,
        returnPercentage: (fund.currentValue - fund.investedAmount) / fund.investedAmount * 100
      })),
      lastUpdated: portfolio.updatedAt
    });

  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary', details: error.message },
      { status: 500 }
    );
  }
}
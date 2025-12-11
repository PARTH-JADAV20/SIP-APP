import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getNextDebitDate } from '@/lib/dbModels';

// In app/api/sip/route.js
export async function POST(request) {
  try {
    const { 
      portfolioId, 
      schemeCode, 
      schemeName, 
      amount, 
      dayOfMonth,
      isInitialInvestment = false
    } = await request.json();

    // Validate inputs
    if (!portfolioId || !schemeCode || !schemeName || amount === undefined || !dayOfMonth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 500) {
      return NextResponse.json(
        { error: 'Minimum SIP amount is ₹500' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 1. Get current NAV
    const navResponse = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!navResponse.ok) {
      throw new Error(`Failed to fetch NAV for scheme ${schemeCode}`);
    }
    const navData = await navResponse.json();
    const currentNav = parseFloat(navData.data[0].nav);
    const schemeFullName = navData.meta?.scheme_name || schemeName;

    // 2. Calculate next debit date
    const nextDebitDate = getNextDebitDate(parseInt(dayOfMonth, 10));

    // 3. Create SIP
    const sip = {
      userId: 'dummyUser', // Replace with actual user ID
      portfolioId: new ObjectId(portfolioId),
      schemeCode,
      schemeName: schemeFullName,
      amount: parseFloat(amount),
      dayOfMonth: parseInt(dayOfMonth, 10),
      nextDebitDate,
      status: 'active',
      unitsAllotted: 0,
      totalInvested: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 4. If this is an initial investment, process it immediately
    if (isInitialInvestment) {
      // Process the first installment
      const unitsAllotted = sip.amount / currentNav;
      // Update portfolio
      await db.collection('virtual_portfolio').updateOne(
        { _id: new ObjectId(portfolioId) },
        {
          $inc: { balance: -sip.amount },
          $push: {
            funds: {
              schemeCode,
              schemeName: schemeFullName,
              units: unitsAllotted,
              averageNav: currentNav,
              investedAmount: sip.amount,
              currentValue: sip.amount,
              lastUpdated: new Date()
            },
            transactions: {
              type: 'SIP',
              amount: sip.amount,
              schemeCode,
              schemeName: schemeFullName,
              units: unitsAllotted,
              nav: currentNav,
              date: new Date(),
              status: 'COMPLETED',
              sipId: null, // Will be set after SIP is created
              notes: 'Initial SIP investment'
            }
          }
        }
      );

      // Update SIP with first installment
      sip.unitsAllotted = unitsAllotted;
      sip.totalInvested = sip.amount;
      sip.transactions = [{
        date: new Date(),
        amount: sip.amount,
        nav: currentNav,
        units: unitsAllotted
      }];
    }

    // 5. Save SIP
    const result = await db.collection('sip_investments').insertOne(sip);

    // 6. If this was an initial investment, update the transaction with the SIP ID
    if (isInitialInvestment) {
      await db.collection('virtual_portfolio').updateOne(
        { 
          _id: new ObjectId(portfolioId),
          'transactions.sipId': null
        },
        {
          $set: {
            'transactions.$.sipId': result.insertedId
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      sipId: result.insertedId,
      message: isInitialInvestment 
        ? 'SIP created and first installment processed' 
        : 'SIP created successfully'
    });

  } catch (error) {
    console.error('Error creating SIP:', error);
    return NextResponse.json(
      { error: 'Failed to create SIP', details: error.message },
      { status: 500 }
    );
  }
}

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
    const sips = await db
      .collection('sip_investments')
      .find({
        portfolioId: new ObjectId(portfolioId),
        status: { $ne: 'cancelled' }
      })
      .sort({ nextDebitDate: 1 })
      .toArray();

    return NextResponse.json(sips);

  } catch (error) {
    console.error('Error fetching SIPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SIPs', details: error.message },
      { status: 500 }
    );
  }
}

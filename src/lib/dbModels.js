import { ObjectId } from 'mongodb';

// Schema for SIP investments
export const SIP = {
  collection: 'sip_investments',
  schema: {
    userId: { type: 'string', required: true },
    portfolioId: { type: 'ObjectId', required: true, ref: 'virtual_portfolio' },
    schemeCode: { type: 'string', required: true },
    schemeName: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 500 }, // Minimum SIP amount is 500
    startDate: { type: 'date', required: true, default: Date.now },
    dayOfMonth: { type: 'number', required: true, min: 1, max: 28 }, // Day of month for SIP debit
    nextDebitDate: { type: 'date', required: true },
    status: { 
      type: 'string', 
      enum: ['active', 'paused', 'cancelled'],
      default: 'active' 
    },
    unitsAllotted: { type: 'number', default: 0 },
    totalInvested: { type: 'number', default: 0 },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
  }
};

// Schema for virtual portfolio
export const VirtualPortfolio = {
  collection: 'virtual_portfolio',
  schema: {
    userId: { type: 'string', required: true },
    portfolioName: { type: 'string', required: true },
    balance: { type: 'number', default: 100000 }, // Starting balance of 1 lakh
    funds: [{
      schemeCode: { type: 'string', required: true },
      schemeName: { type: 'string', required: true },
      units: { type: 'number', default: 0 },
      averageNav: { type: 'number', default: 0 },
      investedAmount: { type: 'number', default: 0 },
      currentValue: { type: 'number', default: 0 },
      lastUpdated: { type: 'date', default: Date.now }
    }],
    transactions: [{
      type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'SIP', 'ONE_TIME'], required: true },
      amount: { type: 'number', required: true },
      schemeCode: { type: 'string' },
      schemeName: { type: 'string' },
      units: { type: 'number' },
      nav: { type: 'number' },
      date: { type: 'date', default: Date.now },
      status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
      sipId: { type: 'ObjectId', ref: 'sip_investments' },
      notes: { type: 'string' }
    }],
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
  }
};

// Helper function to get next SIP debit date
export function getNextDebitDate(dayOfMonth) {
  const now = new Date();
  let nextDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  
  // If the day has already passed this month, set for next month
  if (now.getDate() > dayOfMonth) {
    nextDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
  }
  
  return nextDate;
}

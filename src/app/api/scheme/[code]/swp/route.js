// app/api/scheme/[code]/swp/route.js
import { NextResponse } from 'next/server';

// Helper to convert "dd-mm-yyyy" to Date
function parseDDMMYYYY(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

// Helper to format Date to "yyyy-mm-dd" for map keys
function formatDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(request, { params }) {
  const { code } = params;

  if (!code) {
    return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { initialInvestment, withdrawalAmount, frequency, from, to } = body;
  
  const allowedFrequencies = ['monthly', 'quarterly', 'yearly'];
  if (!initialInvestment || !withdrawalAmount || !from || !to || !allowedFrequencies.includes(frequency)) {
    return NextResponse.json({ 
      error: 'Invalid parameters. Frequency must be monthly, quarterly, or yearly' 
    }, { status: 400 });
  }

  const startDate = new Date(from);
  const endDate = new Date(to);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
    return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    const { data: navHistory } = await response.json();
    if (!navHistory || navHistory.length === 0) {
      return NextResponse.json({ error: 'No NAV data available' }, { status: 404 });
    }

    // Sort NAV ascending by date
    const sortedNavHistory = [...navHistory].sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));
    const navMap = new Map(sortedNavHistory.map(entry => [formatDateKey(parseDDMMYYYY(entry.date)), parseFloat(entry.nav)]));

    // Generate withdrawal dates based on frequency
    const withdrawalDates = [];
    let current = new Date(startDate);
    
    // Determine month increment based on frequency
    let monthIncrement = 1;
    if (frequency === 'quarterly') monthIncrement = 3;
    if (frequency === 'yearly') monthIncrement = 12;

    while (current <= endDate) {
      withdrawalDates.push(new Date(current));
      current.setMonth(current.getMonth() + monthIncrement);
    }

    let corpus = parseFloat(initialInvestment);
    let totalWithdrawn = 0;
    let totalWithdrawals = 0;
    const timeline = [];
    let units = corpus / navMap.get(formatDateKey(startDate));

    // Initial state
    timeline.push({
      date: formatDateKey(startDate),
      corpus: parseFloat(corpus.toFixed(2)),
      withdrawal: 0,
      units: parseFloat(units.toFixed(4))
    });

    for (const withdrawDate of withdrawalDates) {
      if (corpus <= 0) break;

      // Get NAV on withdrawal date or closest previous
      let tempDate = new Date(withdrawDate);
      let nav = navMap.get(formatDateKey(tempDate));
      const earliestDate = parseDDMMYYYY(sortedNavHistory[0].date);

      while ((!nav || nav === 0) && tempDate >= earliestDate) {
        tempDate.setDate(tempDate.getDate() - 1);
        nav = navMap.get(formatDateKey(tempDate));
      }

      if (!nav || nav === 0) {
        break; // Stop if no valid NAV found
      }

      // Calculate current corpus value before withdrawal
      const currentCorpusValue = units * nav;
      
      // Withdraw amount (cannot withdraw more than available corpus)
      const actualWithdrawal = Math.min(withdrawalAmount, currentCorpusValue);
      const unitsToRedeem = actualWithdrawal / nav;
      
      units -= unitsToRedeem;
      totalWithdrawn += actualWithdrawal;
      totalWithdrawals++;
      corpus = units * nav;

      // Add to timeline
      timeline.push({
        date: formatDateKey(withdrawDate),
        corpus: parseFloat(corpus.toFixed(2)),
        withdrawal: parseFloat(actualWithdrawal.toFixed(2)),
        units: parseFloat(units.toFixed(4))
      });

      if (corpus <= 0) break;
    }

    // Calculate duration in months
    const durationMonths = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

    // Calculate annualized return
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let annualizedReturn = 0;
    if (totalDays > 0 && initialInvestment > 0) {
      const totalReturn = (corpus + totalWithdrawn) / initialInvestment;
      annualizedReturn = (Math.pow(totalReturn, 365 / totalDays) - 1) * 100;
    }

    return NextResponse.json({
      initialInvestment: parseFloat(initialInvestment),
      totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
      finalCorpus: parseFloat(corpus.toFixed(2)),
      totalWithdrawals,
      durationMonths,
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      timeline: timeline,
      frequency: frequency
    });

  } catch (error) {
    console.error('SWP Calculation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { initialAmount, stepUpRate, stepUpFrequency, investmentYears, from, to } = body;

    if (!initialAmount || !stepUpRate || !stepUpFrequency || !investmentYears || !from || !to) {
      return NextResponse.json({
        error: 'All parameters are required'
      }, { status: 400 });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
    }

    // Fetch NAV data from external API
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }

    const apiData = await response.json();
    const navHistory = apiData.data;

    if (!navHistory || navHistory.length === 0) {
      return NextResponse.json({ error: 'No NAV data available' }, { status: 404 });
    }

    // Sort NAV ascending by date
    const sortedNavHistory = [...navHistory].sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));
    const navMap = new Map();

    sortedNavHistory.forEach(entry => {
      const date = parseDDMMYYYY(entry.date);
      navMap.set(formatDateKey(date), parseFloat(entry.nav));
    });

    // Generate investment dates (monthly)
    const investmentDates = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      investmentDates.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    let totalInvested = 0;
    let totalUnits = 0;
    let currentSIPAmount = parseFloat(initialAmount);
    let stepUpCount = 0;
    const timeline = [];
    const stepUpMonths = stepUpFrequency === 'yearly' ? 12 :
      stepUpFrequency === 'half-yearly' ? 6 : 3;

    for (let i = 0; i < investmentDates.length; i++) {
      const investDate = investmentDates[i];

      // Apply step up
      if ((i + 1) % stepUpMonths === 0) {
        currentSIPAmount *= (1 + parseFloat(stepUpRate) / 100);
        stepUpCount++;
      }

      totalInvested += currentSIPAmount;

      // Find NAV on investDate or closest previous
      let tempDate = new Date(investDate);
      let nav = navMap.get(formatDateKey(tempDate));
      const earliestDate = parseDDMMYYYY(sortedNavHistory[0].date);

      while ((!nav || nav === 0) && tempDate >= earliestDate) {
        tempDate.setDate(tempDate.getDate() - 1);
        nav = navMap.get(formatDateKey(tempDate));
      }

      if (!nav || nav === 0) {
        continue;
      }

      totalUnits += currentSIPAmount / nav;

      // Add to timeline (quarterly points to reduce data size)
      if (i % 3 === 0 || i === investmentDates.length - 1) {
        const currentValue = totalUnits * (nav || totalUnits * 0); // use last known NAV if missing
        timeline.push({
          date: formatDateKey(investDate),
          investment: parseFloat(totalInvested.toFixed(2)),
          corpus: parseFloat(currentValue.toFixed(2)),
          sipAmount: parseFloat(currentSIPAmount.toFixed(2))
        });
      }
    }

    // Final valuation
    const finalNAV = navMap.get(formatDateKey(finalDate)) ||
      parseFloat(sortedNavHistory[sortedNavHistory.length - 1].nav);
    const finalCorpus = totalUnits * finalNAV;
    const totalProfit = finalCorpus - totalInvested;

    // Calculate annualized return
    const totalDays = (finalDate - startDate) / (1000 * 60 * 60 * 24);
    let annualizedReturn = 0;
    if (totalDays > 0) {
      annualizedReturn = (Math.pow(finalCorpus / totalInvested, 365 / totalDays) - 1) * 100;
    }

    return NextResponse.json({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      finalCorpus: parseFloat(finalCorpus.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      lastSIPAmount: parseFloat(currentSIPAmount.toFixed(2)),
      stepUpCount: stepUpCount,
      totalUnits: parseFloat(totalUnits.toFixed(4)),
      timeline: timeline,
      investmentMonths: investmentDates.length
    });

  } catch (error) {
    console.error('Step Up SIP Calculation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
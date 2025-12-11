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

  const { amount, frequency, from, to } = body;
  
  // FIXED: Validate frequency against allowed values
  const allowedFrequencies = ['monthly', 'quarterly', 'yearly'];
  if (!amount || !from || !to || !allowedFrequencies.includes(frequency)) {
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

    // Generate investment dates based on frequency
    const investmentDates = [];
    let current = new Date(startDate);
    
    // Determine month increment based on frequency
    let monthIncrement = 1;
    if (frequency === 'quarterly') monthIncrement = 3;
    if (frequency === 'yearly') monthIncrement = 12;

    while (current <= endDate) {
      investmentDates.push(new Date(current));
      current.setMonth(current.getMonth() + monthIncrement);
    }

    let totalInvested = 0;
    let totalUnits = 0;
    const timeline = []; // For chart data

    for (const investDate of investmentDates) {
      totalInvested += amount;

      // Find NAV on investDate or closest previous
      let tempDate = new Date(investDate);
      let nav = navMap.get(formatDateKey(tempDate));
      const earliestDate = parseDDMMYYYY(sortedNavHistory[0].date);

      while ((!nav || nav === 0) && tempDate >= earliestDate) {
        tempDate.setDate(tempDate.getDate() - 1);
        nav = navMap.get(formatDateKey(tempDate));
      }

      if (!nav || nav === 0) {
        return NextResponse.json({ error: `No valid NAV for investment date ${formatDateKey(investDate)}` }, { status: 404 });
      }

      totalUnits += amount / nav;

      // Add to timeline for chart (current value at this point)
      const currentValue = totalUnits * nav;
      timeline.push({
        date: formatDateKey(investDate),
        value: parseFloat(currentValue.toFixed(2)),
        invested: totalInvested,
        units: parseFloat(totalUnits.toFixed(4))
      });
    }

    // Latest NAV for current value
    const latestNAV = parseFloat(sortedNavHistory[sortedNavHistory.length - 1].nav);
    const currentValue = totalUnits * latestNAV;

    // Absolute return %
    const absoluteReturn = ((currentValue - totalInvested) / totalInvested) * 100;

    // Approximate annualized return
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let annualizedReturn = 0;
    if (totalDays > 0) {
      annualizedReturn = (Math.pow(currentValue / totalInvested, 365 / totalDays) - 1) * 100;
    }

    return NextResponse.json({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      totalUnits: parseFloat(totalUnits.toFixed(4)),
      absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      timeline: timeline,
      frequency: frequency,
      numberOfInvestments: investmentDates.length
    });

  } catch (error) {
    console.error('SIP Calculation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
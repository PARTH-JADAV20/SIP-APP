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

    console.log("Params:", params);
    console.log("Body:", body);


    const { investmentAmount, from, to } = body;

    if (!investmentAmount || !from || !to) {
      return NextResponse.json({
        error: 'Investment amount and dates are required'
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

    // Find start NAV (closest available date to startDate)
    let startNavDate = new Date(startDate);
    let startNAV = navMap.get(formatDateKey(startNavDate));
    const earliestDate = parseDDMMYYYY(sortedNavHistory[0].date);

    while ((!startNAV || startNAV === 0) && startNavDate >= earliestDate) {
      startNavDate.setDate(startNavDate.getDate() - 1);
      startNAV = navMap.get(formatDateKey(startNavDate));
    }

    if (!startNAV || startNAV === 0) {
      return NextResponse.json({ error: 'No valid NAV found for investment date' }, { status: 404 });
    }

    // Find end NAV (closest available date to endDate)
    let endNavDate = new Date(endDate);
    let endNAV = navMap.get(formatDateKey(endNavDate));
    const latestDate = parseDDMMYYYY(sortedNavHistory[sortedNavHistory.length - 1].date);

    while ((!endNAV || endNAV === 0) && endNavDate <= latestDate) {
      endNavDate.setDate(endNavDate.getDate() + 1);
      endNAV = navMap.get(formatDateKey(endNavDate));
    }

    if (!endNAV || endNAV === 0) {
      return NextResponse.json({ error: 'No valid NAV found for redemption date' }, { status: 404 });
    }

    // Calculate returns
    const units = investmentAmount / startNAV;
    const currentValue = units * endNAV;
    const totalProfit = currentValue - investmentAmount;
    const absoluteReturn = (totalProfit / investmentAmount) * 100;

    // Calculate period in years for annualized return
    const periodDays = (endNavDate - startNavDate) / (1000 * 60 * 60 * 24);
    const periodYears = periodDays / 365;
    let annualizedReturn = 0;

    if (periodYears > 0) {
      annualizedReturn = (Math.pow(currentValue / investmentAmount, 1 / periodYears) - 1) * 100;
    }

    // Generate timeline for chart (monthly data points)
    const timeline = [];
    let currentDate = new Date(startNavDate);
    const finalDate = new Date(endNavDate);

    while (currentDate <= finalDate) {
      const dateKey = formatDateKey(currentDate);
      let nav = navMap.get(dateKey);

      // If no NAV for this date, find closest previous NAV
      if (!nav) {
        let tempDate = new Date(currentDate);
        while (!nav && tempDate >= earliestDate) {
          tempDate.setDate(tempDate.getDate() - 1);
          nav = navMap.get(formatDateKey(tempDate));
        }
      }

      if (nav && nav > 0) {
        const value = units * nav;
        timeline.push({
          date: dateKey,
          value: parseFloat(value.toFixed(2)),
          nav: parseFloat(nav.toFixed(4))
        });
      }

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Add final point if not already included
    const finalKey = formatDateKey(finalDate);
    if (!timeline.some(point => point.date === finalKey)) {
      timeline.push({
        date: finalKey,
        value: parseFloat(currentValue.toFixed(2)),
        nav: parseFloat(endNAV.toFixed(4))
      });
    }

    return NextResponse.json({
      investmentAmount: parseFloat(investmentAmount),
      currentValue: parseFloat(currentValue.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      periodYears: parseFloat(periodYears.toFixed(2)),
      units: parseFloat(units.toFixed(4)),
      startNAV: parseFloat(startNAV.toFixed(4)),
      endNAV: parseFloat(endNAV.toFixed(4)),
      timeline: timeline
    });

  } catch (error) {
    console.error('LumpSum Calculation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
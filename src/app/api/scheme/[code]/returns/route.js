import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!code) {
    return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
  }

  if (!period && (!from || !to)) {
    return NextResponse.json({ error: 'Provide period or from/to dates' }, { status: 400 });
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

    // Parse dates correctly and sort descending (latest first)
    const parsedNavHistory = navHistory.map(entry => ({
      date: entry.date,
      nav: parseFloat(entry.nav),
      parsedDate: parseDDMMYYYY(entry.date)
    })).sort((a, b) => b.parsedDate - a.parsedDate);

    // Use the LATEST available NAV date as end date, not current date
    const latestNavDate = parsedNavHistory[0].parsedDate;
    
    let startDate, endDate;

    if (period) {
      // Use the latest NAV date as end date, not current date
      endDate = new Date(latestNavDate);
      
      // Create a new date object for start date calculation (avoid mutation)
      const startDateCalc = new Date(latestNavDate);
      
      switch (period) {
        case '1m':
          startDateCalc.setMonth(startDateCalc.getMonth() - 1);
          break;
        case '3m':
          startDateCalc.setMonth(startDateCalc.getMonth() - 3);
          break;
        case '6m':
          startDateCalc.setMonth(startDateCalc.getMonth() - 6);
          break;
        case '1y':
          startDateCalc.setFullYear(startDateCalc.getFullYear() - 1);
          break;
        default:
          return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
      }
      startDate = startDateCalc;
    } else {
      startDate = parseDDMMYYYY(from);
      endDate = parseDDMMYYYY(to);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
      }
    }

    console.log(`Period: ${period}, Start: ${startDate}, End: ${endDate}`);

    // Find closest NAV dates
    const findClosestNav = (targetDate, history, isStart = false) => {
      // For exact or previous match
      for (const entry of history) {
        if (entry.parsedDate <= targetDate) {
          return entry;
        }
      }
      // If no past date found, use the earliest available for start date
      return isStart ? history[history.length - 1] : null;
    };

    const endNavEntry = findClosestNav(endDate, parsedNavHistory);
    const startNavEntry = findClosestNav(startDate, parsedNavHistory, true);

    if (!endNavEntry || !startNavEntry) {
      return NextResponse.json({ error: 'Insufficient NAV data' }, { status: 404 });
    }

    // Ensure chronological order
    if (startNavEntry.parsedDate > endNavEntry.parsedDate) {
      return NextResponse.json({ 
        error: 'Start date after end date. Possibly insufficient historical data for the selected period.' 
      }, { status: 400 });
    }

    const startNAV = startNavEntry.nav;
    const endNAV = endNavEntry.nav;
    const days = (endNavEntry.parsedDate - startNavEntry.parsedDate) / (1000 * 60 * 60 * 24);

    const simpleReturn = ((endNAV - startNAV) / startNAV) * 100;

    let annualizedReturn = null;
    if (days >= 30) {
      annualizedReturn = (Math.pow(endNAV / startNAV, 365 / days) - 1) * 100;
    }

    // Format date back to original format
    const formatDate = (date) => {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    return NextResponse.json({
      startDate: formatDate(startNavEntry.parsedDate),
      endDate: formatDate(endNavEntry.parsedDate),
      startNAV,
      endNAV,
      simpleReturn: simpleReturn.toFixed(2),
      annualizedReturn: annualizedReturn ? annualizedReturn.toFixed(2) : null,
    });
  } catch (error) {
    console.error('Error calculating returns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to parse dd-mm-yyyy dates
function parseDDMMYYYY(dateString) {
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
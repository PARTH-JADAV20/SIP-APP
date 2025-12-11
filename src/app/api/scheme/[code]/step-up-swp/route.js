import { NextResponse } from "next/server";

// parse dd-mm-yyyy => Date (explicit)
function parseDDMMYYYY(dateStr) {
  const [dd, mm, yyyy] = dateStr.split("-");
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

// parse yyyy-mm-dd (from client date input) => Date (explicit)
function parseYYYYMMDD(dateStr) {
  const [yyyy, mm, dd] = dateStr.split("-");
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

// format Date => yyyy-mm-dd
function formatDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(request, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: "Scheme code is required" }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { initialCorpus, initialWithdrawal, stepUpRate, stepUpFrequency, withdrawalYears, from, to } = body;

    if (
      initialCorpus == null ||
      initialWithdrawal == null ||
      stepUpRate == null ||
      !stepUpFrequency ||
      withdrawalYears == null ||
      !from ||
      !to
    ) {
      return NextResponse.json({ error: "All parameters are required" }, { status: 400 });
    }

    // Use explicit parser for yyyy-mm-dd from client
    let startDate = parseYYYYMMDD(from);
    let endDate = parseYYYYMMDD(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }

    // Fetch NAV data from external API
    const response = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!response.ok) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    const apiData = await response.json();
    const navHistory = apiData.data;

    if (!navHistory || navHistory.length === 0) {
      return NextResponse.json({ error: "No NAV data available" }, { status: 404 });
    }

    // Sort NAV ascending by date (navHistory dates are dd-mm-yyyy)
    const sortedNavHistory = [...navHistory].sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));

    // map keys in yyyy-mm-dd to nav float
    const navMap = new Map();
    sortedNavHistory.forEach((entry) => {
      const date = parseDDMMYYYY(entry.date);
      navMap.set(formatDateKey(date), parseFloat(entry.nav));
    });

    const earliestDate = parseDDMMYYYY(sortedNavHistory[0].date);
    const latestDate = parseDDMMYYYY(sortedNavHistory[sortedNavHistory.length - 1].date);

    // If requested startDate is earlier than earliest NAV, clamp it to earliest NAV
    if (startDate < earliestDate) {
      startDate = new Date(earliestDate);
    }
    // If requested endDate is after last NAV, clamp it to latest NAV
    if (endDate > latestDate) {
      endDate = new Date(latestDate);
    }

    // Generate monthly withdrawal dates (from startDate to endDate inclusive)
    const withdrawalDates = [];
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      withdrawalDates.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    let corpus = parseFloat(initialCorpus);
    let totalWithdrawn = 0;
    let currentWithdrawalAmount = parseFloat(initialWithdrawal);
    let stepUpCount = 0;
    const timeline = [];
    const yearlySummary = [];
    const stepUpMonths = stepUpFrequency === "yearly" ? 12 : stepUpFrequency === "half-yearly" ? 6 : 3;

    // Find NAV for the start: try same day, if missing search backward then forward to nearest available
    function findNearestNavForDate(dateObj) {
      // Try same date
      let d = new Date(dateObj);
      const maxAttempts = 365 * 3; // safety
      let attempts = 0;

      // search backward up to earliestDate
      while (d >= earliestDate) {
        const key = formatDateKey(d);
        const nav = navMap.get(key);
        if (nav && nav > 0) return { nav, keyDate: new Date(d) };
        d.setDate(d.getDate() - 1);
        attempts++;
        if (attempts > maxAttempts) break;
      }

      // If not found backward, search forward from original date up to latestDate
      d = new Date(dateObj);
      attempts = 0;
      while (d <= latestDate) {
        const key = formatDateKey(d);
        const nav = navMap.get(key);
        if (nav && nav > 0) return { nav, keyDate: new Date(d) };
        d.setDate(d.getDate() + 1);
        attempts++;
        if (attempts > maxAttempts) break;
      }

      return null;
    }

    // initial NAV and units
    const startNavObj = findNearestNavForDate(startDate);
    if (!startNavObj) {
      return NextResponse.json({ error: "No valid NAV found for start date" }, { status: 404 });
    }
    let units = corpus / startNavObj.nav;

    for (let i = 0; i < withdrawalDates.length; i++) {
      if (corpus <= 0) break;

      const withdrawDate = withdrawalDates[i];

      // Apply step up at intervals
      if (i > 0 && i % stepUpMonths === 0) {
        currentWithdrawalAmount *= 1 + parseFloat(stepUpRate) / 100;
        stepUpCount++;
      }

      // find NAV nearest to withdrawDate
      const navObj = findNearestNavForDate(withdrawDate);
      if (!navObj) {
        // no NAV available for this withdrawal; break safely
        break;
      }
      const nav = navObj.nav;

      // current corpus value before withdrawal
      const currentCorpusValue = units * nav;

      // actual withdrawal can't exceed current corpus value
      const actualWithdrawal = Math.min(currentWithdrawalAmount, currentCorpusValue);
      const unitsToRedeem = actualWithdrawal / nav;

      units -= unitsToRedeem;
      totalWithdrawn += actualWithdrawal;
      corpus = Math.max(0, units * nav);

      // Yearly summary (every 12 months (i % 12 === 11) or last)
      if (i % 12 === 11 || i === withdrawalDates.length - 1) {
        const year = Math.floor(i / 12) + 1;
        yearlySummary.push({
          year: year,
          corpus: parseFloat(corpus.toFixed(2)),
          withdrawal: parseFloat(currentWithdrawalAmount.toFixed(2)),
          totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
        });
      }

      // timeline (quarterly points or last)
      if (i % 3 === 0 || i === withdrawalDates.length - 1) {
        timeline.push({
          date: formatDateKey(withdrawDate),
          corpus: parseFloat(corpus.toFixed(2)),
          withdrawal: parseFloat(actualWithdrawal.toFixed(2)),
        });
      }

      if (corpus <= 0) break;
    }

    // Calculate duration in years (approx)
    const durationYears = withdrawalDates.length / 12;

    // Annualized return
    const totalDays = (finalDate - startDate) / (1000 * 60 * 60 * 24);
    let annualizedReturn = 0;
    if (totalDays > 0 && initialCorpus > 0) {
      const totalReturn = (corpus + totalWithdrawn) / initialCorpus;
      annualizedReturn = (Math.pow(totalReturn, 365 / totalDays) - 1) * 100;
    }

    return NextResponse.json({
      initialCorpus: parseFloat(initialCorpus),
      finalCorpus: parseFloat(corpus.toFixed(2)),
      totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
      lastWithdrawal: parseFloat(currentWithdrawalAmount.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      durationYears: parseFloat(durationYears.toFixed(1)),
      stepUpCount: stepUpCount,
      totalUnits: parseFloat(units.toFixed(4)),
      timeline: timeline,
      yearlySummary: yearlySummary,
    });
  } catch (error) {
    console.error("Step Up SWP Calculation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

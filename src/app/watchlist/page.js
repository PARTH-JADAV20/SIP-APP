'use client';
import { useEffect, useState } from 'react';
import NavChart from '../components/NavChart'; // your chart component

export default function WatchlistPage() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);

    // ⭐ NEW: Calculate Simple (Absolute) Return for X years
    function calculateSimpleReturn(navHistory, years) {
        if (!navHistory || navHistory.length < 2) return 0;

        const endNAV = navHistory[navHistory.length - 1].nav;
        const endDate = new Date(navHistory[navHistory.length - 1].date);

        // Find closest NAV X years ago
        const startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - years);

        let startNAV = navHistory[0].nav;
        for (let i = navHistory.length - 1; i >= 0; i--) {
            const d = new Date(navHistory[i].date);
            if (d <= startDate) {
                startNAV = navHistory[i].nav;
                break;
            }
        }

        if (startNAV === 0) return 0; // Avoid division by zero

        // Simple Return = ((End NAV / Start NAV) - 1) * 100
        console.log('Start NAV:', startNAV, 'End NAV:', endNAV);

        return (((endNAV / startNAV) - 1) * 100).toFixed(2);
    }


    // Risk (volatility)
    function calculateRisk(navHistory) {
        if (!navHistory || navHistory.length < 2) return 0;
        const returns = navHistory.slice(1).map((v, i) => (v.nav - navHistory[i].nav) / navHistory[i].nav);
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
        return (Math.sqrt(variance) * 100).toFixed(2);
    }

    const fetchWatchlist = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/watchlist');
            const data = await res.json();

            const funds = Array.isArray(data) ? data : [];
            const enriched = await Promise.all(
                funds.map(async (fund) => {
                    // Ensure navHistory is an array of {date, nav} sorted ascending (oldest -> newest)
                    const navHistory = (fund.navHistory || [])
                        .map(d => ({ date: d.date, nav: parseFloat(d.nav) }))
                        .filter(d => !Number.isNaN(d.nav) && d.date)
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                    // Determine availability based on date span (not just count)
                    const latestDate = navHistory.length ? new Date(navHistory[navHistory.length - 1].date) : null;
                    const has1YearData = latestDate && navHistory.some(n => new Date(n.date) <= new Date(latestDate.getFullYear() - 1, latestDate.getMonth(), latestDate.getDate()));
                    const has3YearData = latestDate && navHistory.some(n => new Date(n.date) <= new Date(latestDate.getFullYear() - 3, latestDate.getMonth(), latestDate.getDate()));
                    const has5YearData = latestDate && navHistory.some(n => new Date(n.date) <= new Date(latestDate.getFullYear() - 5, latestDate.getMonth(), latestDate.getDate()));

                    // Calculate returns; if insufficient data, use '-'
                    const r1 = has1YearData ? calculateSimpleReturn(navHistory, 1) : '-';
                    const r3 = has3YearData ? calculateSimpleReturn(navHistory, 3) : '-';
                    const r5 = has5YearData ? calculateSimpleReturn(navHistory, 5) : '-';

                    return {
                        ...fund,
                        navHistory,
                        nav: navHistory.length ? navHistory[navHistory.length - 1].nav : 0,
                        // store numeric strings or '-' so UI can parse them
                        return_1y: r1,
                        return_3y: r3,
                        return_5y: r5,
                        risk: calculateRisk(navHistory),
                    };
                })
            );

            setWatchlist(enriched);
        } catch (err) {
            console.error(err);
            setWatchlist([]);
        }
        setLoading(false);
    };

    const removeFromWatchlist = async (schemeCode) => {
        await fetch('/api/watchlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scheme_code: schemeCode }),
        });
        fetchWatchlist();
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    if (loading) return <p>Loading watchlist...</p>;
    if (!watchlist.length) return <p>No funds in watchlist.</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Watchlist</h1>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Fund Name</th>
                        <th className="border p-2">NAV</th>
                        <th className="border p-2">1Y %</th>
                        <th className="border p-2">3Y %</th>
                        <th className="border p-2">5Y %</th>
                        <th className="border p-2">Risk %</th>
                        <th className="border p-2">Chart</th>
                        <th className="border p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {watchlist.map((f) => (
                        <tr key={f.schemeCode}>
                            <td className="border p-2">{f.name}</td>
                            <td className="border p-2">{f.nav}</td>
                            {/* The conditional class logic remains correct for returns */}
                            <td className={`border p-2 ${f.return_1y !== '-' && !Number.isNaN(parseFloat(f.return_1y)) && parseFloat(f.return_1y) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{f.return_1y}</td>
                            <td className={`border p-2 ${f.return_3y !== '-' && parseFloat(f.return_3y) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{f.return_3y}</td>
                            <td className={`border p-2 ${f.return_5y !== '-' && parseFloat(f.return_5y) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{f.return_5y}</td>
                            <td className="border p-2">{f.risk}</td>
                            <td className="border p-2" style={{ width: '150px', height: '80px' }}>
                                {f.navHistory.length > 0 && <NavChart data={f.navHistory.slice(-90)} />}
                            </td>
                            <td className="border p-2">
                                <button
                                    className="text-red-500 hover:underline"
                                    onClick={() => removeFromWatchlist(f.schemeCode)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Grid,
  Box,
  useTheme,
  Card,
  CardContent,
  Slider
} from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function formatCurrency(x) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(x);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

export default function LumpSumCalculator({ code, navHistory }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const sortedHistory = [...(navHistory || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const maxDate = sortedHistory[0]?.date;
  const minDate = sortedHistory[sortedHistory.length - 1]?.date;

  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dateError, setDateError] = useState(false);
  const [dateErrorMessage, setDateErrorMessage] = useState("");

  useEffect(() => {
    if (maxDate) setTo(formatDate(maxDate));
    if (minDate) setFrom(formatDate(minDate));
  }, [minDate, maxDate]);

  useEffect(() => {
    if (!from || !to) {
      setDateError(false);
      setDateErrorMessage("");
      return;
    }
    const start = new Date(from);
    const end = new Date(to);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setDateError(true);
      setDateErrorMessage("Invalid date format");
      return;
    }
    if (start > end) {
      setDateError(true);
      setDateErrorMessage("Investment date cannot be after redemption date");
    } else {
      setDateError(false);
      setDateErrorMessage("");
    }
  }, [from, to]);

  async function calculate() {
    if (!from || !to || dateError) {
      setResult({ error: dateError ? dateErrorMessage || "Invalid date range" : "Select dates" });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/scheme/${code}/lumpsum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investmentAmount: Number(investmentAmount),
          from,
          to,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const errorData = await res.json();
          setResult(errorData);
        } else {
          setResult({ error: `Server error: ${res.status} ${res.statusText}` });
        }
        return;
      }

      if (!contentType.includes("application/json")) {
        setResult({ error: "Received non-JSON response from server. Check API endpoint." });
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to calculate" });
    } finally {
      setLoading(false);
    }
  }

  const calculateEstimatedReturns = () => {
    if (!result || !result.annualizedReturn) return null;

    const annualReturn = result.annualizedReturn / 100;
    const periods = [
      { years: 1, label: "1 Year" },
      { years: 3, label: "3 Years" },
      { years: 5, label: "5 Years" },
      { years: 10, label: "10 Years" },
    ];

    return periods.map((period) => {
      const futureValue = investmentAmount * Math.pow(1 + annualReturn, period.years);
      const profit = futureValue - investmentAmount;
      return {
        ...period,
        futureValue: parseFloat(futureValue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        returnPercentage: parseFloat(((profit / investmentAmount) * 100).toFixed(2)),
      };
    });
  };

  const estimatedReturns = calculateEstimatedReturns();

  // Prepare chart data
  const getChartData = () => {
    if (!result || !result.timeline) return [];
    return result.timeline.map(item => ({
      date: item.date,
      value: item.value || 0
    }));
  };

  const chartData = getChartData();

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          textAlign: "center",
          color: darkMode ? '#E2E8DD' : '#4E5340'
        }}
      >
        LumpSum Calculator
      </Typography>

      {/* Input Section */}
      <Card sx={{
        p: 3,
        borderRadius: 3,
        background: darkMode
          ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
        border: darkMode 
          ? '1px solid rgba(78, 83, 64, 0.3)'
          : '1px solid rgba(226, 232, 221, 0.8)',
      }}>
        <CardContent sx={{ p: 0 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ px: 1, mb: 2 }}>
                <Typography gutterBottom sx={{ color: darkMode ? '#E2E8DD' : '#4E5340' }}>
                  Investment Amount: {formatCurrency(investmentAmount)}
                </Typography>
                <Slider
                  value={investmentAmount}
                  onChange={(e, newValue) => setInvestmentAmount(newValue)}
                  min={10000}
                  max={1000000}
                  step={10000}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => formatCurrency(value)}
                  sx={{
                    color: darkMode ? '#B7D1DA' : '#4E5340',
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Investment Date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formatDate(minDate), max: formatDate(maxDate) }}
                fullWidth
                error={Boolean(dateError && from && to)}
                helperText={dateError && from && to ? dateErrorMessage : ""}
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Redemption Date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formatDate(minDate), max: formatDate(maxDate) }}
                fullWidth
                error={Boolean(dateError && from && to)}
                helperText={dateError && from && to ? dateErrorMessage : ""}
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  }
                }}
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={calculate}
            disabled={loading || !from || !to || dateError}
            size="large"
            fullWidth
            sx={{ 
              mt: 3, 
              py: 1.5, 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3a3e30 0%, #565b4d 100%)',
              }
            }}
          >
            {loading ? "Calculating..." : "Calculate Returns"}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          {result.error ? (
            <Card sx={{ p: 3, textAlign: "center" }}>
              <Typography color="error">{result.error}</Typography>
            </Card>
          ) : (
            <>
              {/* Historical Returns */}
              <Card sx={{
                p: 3,
                borderRadius: 3,
                background: darkMode
                  ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
                  : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
                border: darkMode 
                  ? '1px solid rgba(78, 83, 64, 0.3)'
                  : '1px solid rgba(226, 232, 221, 0.8)',
              }}>
                <CardContent sx={{ p: 0 }}>
                  <Grid container spacing={2}>
                    {[
                      { label: "Investment Amount", value: formatCurrency(result.investmentAmount), color: "#4E5340" },
                      { label: "Current Value", value: formatCurrency(result.currentValue), color: "#697268" },
                      { label: "Absolute Return", value: `${result.absoluteReturn}%`, color: "#95A3A4" },
                      { label: "Annualized Return", value: `${Number(result.annualizedReturn).toFixed(2)}%`, color: "#B7D1DA" },
                      { label: "Investment Period", value: `${result.periodYears} years`, color: "#4E5340" },
                      { label: "Total Profit", value: formatCurrency(result.totalProfit), color: result.totalProfit >= 0 ? "#697268" : "#ff4444" },
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                            textAlign: "center",
                            border: darkMode 
                              ? '1px solid rgba(78, 83, 64, 0.4)'
                              : '1px solid rgba(226, 232, 221, 0.8)',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Estimated Future Returns */}
              {estimatedReturns && (
                <Card sx={{
                  p: 3,
                  borderRadius: 3,
                  background: darkMode
                    ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
                  border: darkMode 
                    ? '1px solid rgba(78, 83, 64, 0.3)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600, 
                        textAlign: "center",
                        color: darkMode ? '#E2E8DD' : '#4E5340'
                      }}
                    >
                      Estimated Future Returns
                    </Typography>
                    <Grid container spacing={2}>
                      {estimatedReturns.map((est, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                              textAlign: "center",
                              border: darkMode 
                                ? '1px solid rgba(78, 83, 64, 0.4)'
                                : '1px solid rgba(226, 232, 221, 0.8)',
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                              {est.label}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "#697268" }}>
                              {formatCurrency(est.futureValue)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mt: 1 }}>
                              Profit: {formatCurrency(est.profit)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#95A3A4", fontWeight: 600 }}>
                              +{est.returnPercentage}%
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Growth Chart */}
              {chartData.length > 0 && (
                <Card sx={{
                  p: 3,
                  borderRadius: 3,
                  background: darkMode
                    ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
                  border: darkMode 
                    ? '1px solid rgba(78, 83, 64, 0.3)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <CardContent sx={{ p: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        fontWeight: 600, 
                        textAlign: "center",
                        color: darkMode ? '#E2E8DD' : '#4E5340'
                      }}
                    >
                      Investment Growth
                    </Typography>
                    <Box sx={{ width: "100%", height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2a2e2a' : '#e0e0e0'} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: darkMode ? '#95A3A4' : '#697268' }}
                            axisLine={{ stroke: darkMode ? '#95A3A4' : '#697268' }}
                          />
                          <YAxis
                            tick={{ fill: darkMode ? '#95A3A4' : '#697268' }}
                            axisLine={{ stroke: darkMode ? '#95A3A4' : '#697268' }}
                            tickFormatter={(value) =>
                              new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                notation: "compact",
                                maximumFractionDigits: 0
                              }).format(value)
                            }
                          />
                          <Tooltip
                            formatter={(value) => [formatCurrency(value), "Portfolio Value"]}
                            contentStyle={{
                              backgroundColor: darkMode ? '#2a2e2a' : '#ffffff',
                              border: darkMode ? '1px solid #4E5340' : '1px solid #E2E8DD',
                              borderRadius: '8px',
                              color: darkMode ? '#E2E8DD' : '#4E5340'
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={darkMode ? '#4E5340' : '#4E5340'}
                            fill={darkMode ? '#4E5340' : '#4E5340'}
                            fillOpacity={0.6}
                            name="Portfolio Value"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
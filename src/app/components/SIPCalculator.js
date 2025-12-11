"use client";

import React, { useState, useEffect } from 'react';
import { TextField, MenuItem, Button, Typography, Grid, Box, useTheme, Card, CardContent } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

function formatCurrency(x) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(x);
}

export default function SIPCalculator({ code, navHistory }) {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  
  const sortedHistory = [...navHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const minDate = sortedHistory[0]?.date;
  const maxDate = sortedHistory[sortedHistory.length - 1]?.date;

  function formatDate(dateStr) {
    const [dd, mm, yyyy] = dateStr.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  const [amount, setAmount] = useState(6000);
  const [freq, setFreq] = useState('monthly');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (maxDate) setFrom(formatDate(maxDate));
    if (minDate) setTo(formatDate(minDate));
  }, [minDate, maxDate]);

  async function calculate() {
    if (!from || !to) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/scheme/${code}/sip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), frequency: freq, from, to }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Failed to calculate' });
    } finally {
      setLoading(false);
    }
  }

  // Prepare chart data
  const getChartData = () => {
    if (!result || !result.timeline) return [];
    return result.timeline.map(item => ({
      date: item.date,
      value: item.value || 0,
      investment: item.investment || 0
    }));
  };

  const chartData = getChartData();

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          textAlign: 'center',
          color: darkMode ? '#E2E8DD' : '#4E5340'
        }}
      >
        SIP Calculator
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Investment Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                helperText="Monthly investment amount"
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Investment Frequency"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  }
                }}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formatDate(minDate), max: formatDate(maxDate) }}
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formatDate(minDate), max: formatDate(maxDate) }}
                fullWidth
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
            disabled={loading || !from || !to}
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
            {loading ? 'Calculating...' : 'Calculate Returns'}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
          {result.error ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{result.error}</Typography>
            </Card>
          ) : (
            <>
              {/* Results Grid */}
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
                      { label: 'Total Invested', value: formatCurrency(result.totalInvested), color: '#4E5340' },
                      { label: 'Current Value', value: formatCurrency(result.currentValue), color: '#697268' },
                      { label: 'Absolute Return', value: `${result.absoluteReturn}%`, color: '#95A3A4' },
                      { label: 'Annualized Return', value: `${Number(result.annualizedReturn).toFixed(2)}%`, color: '#B7D1DA' }
                    ].map((item, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                          textAlign: 'center',
                          border: darkMode 
                            ? '1px solid rgba(78, 83, 64, 0.4)'
                            : '1px solid rgba(226, 232, 221, 0.8)',
                        }}>
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
                        textAlign: 'center',
                        color: darkMode ? '#E2E8DD' : '#4E5340'
                      }}
                    >
                      Investment Growth
                    </Typography>
                    <Box sx={{ width: '100%', height: 400 }}>
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
                            tickFormatter={(value) => new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              notation: 'compact',
                              maximumFractionDigits: 0
                            }).format(value)}
                          />
                          <Tooltip 
                            formatter={(value) => [formatCurrency(value), 'Portfolio Value']}
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
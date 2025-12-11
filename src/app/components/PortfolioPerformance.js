// components/PortfolioPerformance.js
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#A4DE6C', '#D0ED57', '#8884D8', '#82CA9D'
];

export default function PortfolioPerformance({ portfolioId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/portfolio/analytics?portfolioId=${portfolioId}`);
        if (!response.ok) throw new Error('Failed to fetch portfolio analytics');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (portfolioId) {
      fetchData();
    }
  }, [portfolioId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={4}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  const { valueOverTime, assetAllocation, totalValue } = data;

  // Calculate performance metrics
  const firstValue = valueOverTime[0]?.value || 0;
  const lastValue = valueOverTime[valueOverTime.length - 1]?.value || 0;
  const returnAmount = lastValue - firstValue;
  const returnPercentage = firstValue > 0 ? (returnAmount / firstValue) * 100 : 0;
  const isPositive = returnAmount >= 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="portfolio tabs"
        >
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Holdings" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Portfolio Value</Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={valueOverTime}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                    />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value) => [
                        new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(value),
                        'Value'
                      ]}
                      labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Portfolio Value"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="invested"
                      name="Amount Invested"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Current Value</Typography>
                  <Typography variant="h4">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(lastValue)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Total Invested</Typography>
                  <Typography variant="h6">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(firstValue)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Returns</Typography>
                  <Box display="flex" alignItems="center">
                    {isPositive ? (
                      <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography 
                      variant="h6" 
                      color={isPositive ? 'success.main' : 'error.main'}
                    >
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      }).format(returnAmount)} ({Math.abs(returnPercentage).toFixed(2)}%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Asset Allocation</Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="schemeName"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {assetAllocation.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          }).format(value),
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Performance Over Time</Typography>
          <Box sx={{ height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={valueOverTime}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                />
                <YAxis 
                  tickFormatter={(value) => 
                    new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(value)
                  }
                />
                <Tooltip 
                  formatter={(value) => [
                    new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(value),
                    'Value'
                  ]}
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Portfolio Value"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name="Amount Invested"
                  stroke="#82ca9d"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Your Holdings</Typography>
          <Grid container spacing={3}>
            {assetAllocation.map((asset, index) => {
              const isPositive = (asset.value / asset.invested || 1) >= 1;
              return (
                <Grid item xs={12} sm={6} md={4} key={asset.schemeCode}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" noWrap>
                          {asset.schemeName}
                        </Typography>
                        <Chip
                          label={asset.percentage.toFixed(1) + '%'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="h6" mb={1}>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        }).format(asset.value)}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          {asset.units.toFixed(4)} units
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          NAV: {asset.nav?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>

                      {asset.invested > 0 && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              Invested
                            </Typography>
                            <Typography variant="body2">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0
                              }).format(asset.invested)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" color="text.secondary">
                              Returns
                            </Typography>
                            <Box display="flex" alignItems="center">
                              {isPositive ? (
                                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                              ) : (
                                <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                              )}
                              <Typography 
                                variant="body2" 
                                color={isPositive ? 'success.main' : 'error.main'}
                                fontWeight="medium"
                              >
                                {((asset.value - asset.invested) / asset.invested * 100).toFixed(2)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
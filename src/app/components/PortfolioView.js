// components/PortfolioView.js
'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function PortfolioView({ portfolioId }) {
  const [portfolio, setPortfolio] = useState(null);
  const [navData, setNavData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolio data
        const portfolioRes = await fetch(`/api/virtual-portfolio/${portfolioId}`);
        if (!portfolioRes.ok) throw new Error('Failed to fetch portfolio');
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData);

        // Fetch NAV history for each fund
        const navPromises = portfolioData.funds.map(fund => 
          fetch(`/api/scheme/${fund.schemeCode}`).then(res => res.json())
        );
        const navResults = await Promise.all(navPromises);
        
        // Process NAV data for chart
        const chartData = {
          labels: [],
          datasets: portfolioData.funds.map((fund, index) => {
            const navs = navResults[index]?.data || [];
            return {
              label: fund.schemeName,
              data: navs.map(nav => ({
                x: new Date(nav.date),
                y: parseFloat(nav.nav)
              })),
              borderColor: `hsl(${index * 137.5}, 70%, 50%)`,
              fill: false
            };
          })
        };
        
        setNavData(chartData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (portfolioId) {
      fetchData();
    }
  }, [portfolioId]);

  if (loading) return <div>Loading...</div>;
  if (!portfolio) return <div>Portfolio not found</div>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{portfolio.portfolioName}</Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/virtual-portfolio')}
        >
          Back to Portfolios
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
            {navData && (
              <Box sx={{ height: 400 }}>
                <Line 
                  data={navData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        type: 'time',
                        time: {
                          unit: 'month'
                        }
                      },
                      y: {
                        beginAtZero: false
                      }
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Portfolio Summary</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Total Invested" />
                <ListItemSecondaryAction>
                  {portfolio.totalInvested.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  })}
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Current Value" />
                <ListItemSecondaryAction>
                  {portfolio.currentValue.toLocaleString('en-IN', {
                    style: 'currency',
                    currency: 'INR'
                  })}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Total Returns" 
                  primaryTypographyProps={{ 
                    color: portfolio.currentValue >= portfolio.totalInvested ? 'success.main' : 'error.main'
                  }}
                />
                <ListItemSecondaryAction>
                  <Typography 
                    color={portfolio.currentValue >= portfolio.totalInvested ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {((portfolio.currentValue - portfolio.totalInvested) / portfolio.totalInvested * 100).toFixed(2)}%
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Holdings</Typography>
            <List>
              {portfolio.funds.map((fund, index) => (
                <ListItem key={index} divider>
                  <ListItemText 
                    primary={fund.schemeName}
                    secondary={`${fund.units.toFixed(4)} units`}
                  />
                  <ListItemSecondaryAction>
                    <Box textAlign="right">
                      <Box>
                        {(fund.units * (navData?.datasets[index]?.data[0]?.y || 0)).toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR'
                        })}
                      </Box>
                      <Typography 
                        variant="body2" 
                        color={fund.currentValue >= fund.investedAmount ? 'success.main' : 'error.main'}
                      >
                        {((fund.currentValue / fund.investedAmount - 1) * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
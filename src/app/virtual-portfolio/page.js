// app/virtual-portfolio/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Box,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function PortfolioList() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const res = await fetch('/api/virtual-portfolio');
        if (!res.ok) throw new Error('Failed to fetch portfolios');
        const data = await res.json();
        setPortfolios(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, []);

  const handleCreatePortfolio = async () => {
    try {
      const res = await fetch('/api/virtual-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioName: 'New Portfolio',
          startingBalance: 100000
        })
      });
      
      if (!res.ok) throw new Error('Failed to create portfolio');
      const newPortfolio = await res.json();
      router.push(`/virtual-portfolio/${newPortfolio._id}`);
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">My Portfolios</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleCreatePortfolio}
        >
          New Portfolio
        </Button>
      </Box>

      {portfolios.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="background.paper" borderRadius={2}>
          <Typography variant="h6" gutterBottom>No portfolios yet</Typography>
          <Typography color="text.secondary" mb={3}>
            Create your first portfolio to start tracking your investments
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleCreatePortfolio}
          >
            Create Portfolio
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => {
            const totalInvested = portfolio.funds?.reduce((sum, fund) => sum + (fund.investedAmount || 0), 0) || 0;
            const currentValue = portfolio.funds?.reduce((sum, fund) => sum + (fund.currentValue || 0), 0) || 0;
            const returnAmount = currentValue - totalInvested;
            const returnPercentage = totalInvested > 0 ? (returnAmount / totalInvested) * 100 : 0;
            const isPositive = returnAmount >= 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={portfolio._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => router.push(`/virtual-portfolio/${portfolio._id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" noWrap>
                        {portfolio.portfolioName}
                      </Typography>
                      <Chip
                        label={portfolio.funds?.length || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Current Value
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {currentValue.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        })}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Total Invested
                      </Typography>
                      <Typography variant="body2">
                        {totalInvested.toLocaleString('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0
                        })}
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
                          {returnAmount.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0
                          })} ({Math.abs(returnPercentage).toFixed(2)}%)
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/virtual-portfolio/${portfolio._id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
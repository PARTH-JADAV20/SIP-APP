"use client";

import { Button, Card, CardContent, Typography, TextField, Container, Box, useTheme, Chip, Stack } from "@mui/material";
import Link from "next/link";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalculateIcon from '@mui/icons-material/Calculate';
import SearchIcon from '@mui/icons-material/Search';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ShowChartIcon from '@mui/icons-material/ShowChart';

export default function HomePage() {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const stats = [
    { value: '10K+', label: 'Fund Schemes' },
    { value: '₹500Cr+', label: 'Assets Managed' },
    { value: '98%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'Live Updates' },
  ];

  const features = [
    {
      icon: <SearchIcon sx={{ fontSize: 40 }} />,
      title: "Smart Fund Search",
      description: "Advanced filtering to find the perfect mutual funds based on your risk profile and investment goals.",
      color: '#4E5340'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: "Performance Analytics",
      description: "Comprehensive analysis of fund performance with detailed charts and comparative metrics.",
      color: '#697268'
    },
    {
      icon: <CalculateIcon sx={{ fontSize: 40 }} />,
      title: "SIP Calculator",
      description: "Accurate SIP return calculations with customizable parameters and future projections.",
      color: '#95A3A4'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: "Portfolio Insights",
      description: "Deep insights into your portfolio allocation and diversification across different sectors.",
      color: '#B7D1DA'
    },
    {
      icon: <ShowChartIcon sx={{ fontSize: 40 }} />,
      title: "Market Trends",
      description: "Stay updated with real-time market trends and expert investment recommendations.",
      color: '#4E5340'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Risk Assessment",
      description: "Comprehensive risk analysis to help you make informed investment decisions.",
      color: '#697268'
    }
  ];

  return (
    <main className={`min-h-screen flex flex-col ${darkMode ? 'bg-gradient-to-br from-[#1a1d1a] via-[#242724] to-[#2a2e2a]' : 'bg-gradient-to-br from-[#E2E8DD] via-[#F5F7F3] to-[#B7D1DA]'}`}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <section className="flex flex-col items-center justify-center text-center">
          <Chip 
            label="Trusted by 50,000+ Investors" 
            variant="outlined"
            sx={{ 
              mb: 3, 
              color: '#4E5340', 
              borderColor: '#4E5340',
              backgroundColor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(78, 83, 64, 0.1)',
              fontWeight: 600 
            }}
          />
          
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              background: darkMode 
                ? 'linear-gradient(135deg, #E2E8DD 0%, #95A3A4 100%)'
                : 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              lineHeight: 1.2
            }}
          >
            Grow Your Wealth
            <br />
            <span style={{ fontSize: '0.6em' }}>with Smart SIP Investments</span>
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 2, 
              maxWidth: '600px',
              color: darkMode ? '#95A3A4' : '#4E5340',
              fontSize: '1.2rem',
              lineHeight: 1.6
            }}
          >
            Track, analyze, and maximize your mutual fund SIP returns with our comprehensive platform. 
            Make informed decisions with real-time data and expert insights.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
            <Link href="/funds" style={{ textDecoration: 'none' }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<TrendingUpIcon />}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                Explore Funds
              </Button>
            </Link>
          </Stack>

          {/* Stats Section */}
          <Box sx={{ mt: 8, maxWidth: '800px', width: '100%' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: darkMode ? 'rgba(226, 232, 221, 0.05)' : 'rgba(78, 83, 64, 0.05)',
                    border: darkMode ? '1px solid rgba(226, 232, 221, 0.1)' : '1px solid rgba(78, 83, 64, 0.1)',
                  }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: darkMode ? '#E2E8DD' : '#4E5340',
                      mb: 1
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: darkMode ? '#95A3A4' : '#697268',
                      fontWeight: 500
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </div>
          </Box>
        </section>
      </Container>

      {/* Features Section - Fixed Grid Layout */}
      <section className={`py-16 px-4 ${darkMode ? 'bg-[#1a1d1a]' : 'bg-white'} rounded-t-3xl`}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            sx={{ 
              textAlign: 'center',
              fontWeight: 700,
              mb: 2,
              color: darkMode ? '#E2E8DD' : '#4E5340'
            }}
          >
            Everything You Need to Invest Smartly
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              mb: 8,
              color: darkMode ? '#95A3A4' : '#697268',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Powerful tools and insights to help you build and manage your investment portfolio
          </Typography>
          
          {/* Fixed Grid Layout - 3 cards per row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    background: `linear-gradient(135deg, ${feature.color}20, transparent)`,
                    borderRadius: 18,
                    zIndex: 0,
                  }
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1, position: 'relative', zIndex: 1 }}>
                  <Box 
                    sx={{ 
                      color: feature.color,
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 3,
                      backgroundColor: darkMode 
                        ? `${feature.color}15` 
                        : `${feature.color}10`,
                      mx: 'auto'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      textAlign: 'center',
                      fontWeight: 600,
                      mb: 2,
                      color: darkMode ? '#E2E8DD' : '#4E5340'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    sx={{ 
                      textAlign: 'center',
                      color: darkMode ? '#95A3A4' : '#697268',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={`py-16 px-6 text-center ${darkMode ? 'bg-[#242724]' : 'bg-[#E2E8DD]'}`}>
        <Container maxWidth="md">
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              mb: 3,
              color: darkMode ? '#E2E8DD' : '#4E5340'
            }}
          >
            Start Your Investment Journey Today
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4,
              color: darkMode ? '#95A3A4' : '#697268'
            }}
          >
            Join thousands of smart investors who trust our platform for their financial growth
          </Typography>
          
          <Box sx={{ maxWidth: '400px', mx: 'auto' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="Enter your email"
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  sx: {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(226, 232, 221, 0.3)' : 'rgba(78, 83, 64, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'rgba(226, 232, 221, 0.5)' : 'rgba(78, 83, 64, 0.5)',
                    },
                  }
                }}
              />
              <Button 
                variant="contained"
                sx={{ 
                  minWidth: '140px',
                  whiteSpace: 'nowrap'
                }}
              >
                Get Started
              </Button>
            </Stack>
          </Box>
        </Container>
      </section>
    </main>
  );
}
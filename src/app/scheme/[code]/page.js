"use client";

import ReturnsTable from "../../components/ReturnsTable";
import SIPCalculator from "../../components/SIPCalculator";
import SWPCalculator from "../../components/SWPCalculator";
import LumpSumCalculator from "../../components/LUMPSUMPCalc";
import StepUpSIPCalculator from "../../components/StepUpSIPCalculator";
import StepUpSWPCalculator from "../../components/StepUpSWPCalculator";
import RollingReturnsCalculator from '../../components/RollingReturnsCalculator';
import InvestButton from "../../components/InvestButton";
import Button from '@mui/material/Button';
import FavoriteIcon from '@mui/icons-material/Favorite';

import { useState, useEffect } from "react";
import { use } from "react";
import {
  CircularProgress,
  Paper,
  Grid,
  Typography,
  Container,
  Box,
  useTheme,
  Chip,
  Card,
  CardContent
} from "@mui/material";

// Import for Tabs
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// Import Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CategoryIcon from '@mui/icons-material/Category';
import CodeIcon from '@mui/icons-material/Code';
import CalculateIcon from '@mui/icons-material/Calculate';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LayersIcon from '@mui/icons-material/Layers';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SouthEastIcon from '@mui/icons-material/SouthEast';

import NavChart from "../../components/NavChart";

export default function SchemePage({ params }) {
  const { code } = use(params);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [activeCalculator, setActiveCalculator] = useState('returns'); // State for active tab
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/scheme/${code}`);
        const data = await res.json();
        if (!mounted) return;
        setMeta(data.metadata || {});
        setNavHistory(data.navHistory || []);
      } catch (err) {
        console.error("Error fetching scheme data:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (code) load();
    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/virtual-portfolio');
        if (res.ok) {
          const portfolios = await res.json();
          if (portfolios.length > 0) {
            setSelectedPortfolioId(portfolios[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      }
    };
    fetchPortfolio();
  }, []);

  const handleCalculatorChange = (event, newValue) => {
    setActiveCalculator(newValue);
  };

  const calculatorTheme = {
    color: darkMode ? '#E2E8DD' : '#4E5340',
    background: darkMode
      ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
      : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
    border: darkMode
      ? '1px solid rgba(78, 83, 64, 0.3)'
      : '1px solid rgba(226, 232, 221, 0.8)',
    boxShadow: darkMode
      ? '0 8px 40px rgba(0, 0, 0, 0.3)'
      : '0 8px 40px rgba(78, 83, 64, 0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: darkMode
        ? '0 12px 50px rgba(0, 0, 0, 0.4)'
        : '0 12px 50px rgba(78, 83, 64, 0.2)',
    }
  };

  if (loading)
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          flexDirection: 'column',
          gap: 3
        }}>
          <CircularProgress
            size={60}
            sx={{
              color: darkMode ? '#B7D1DA' : '#4E5340'
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: darkMode ? '#95A3A4' : '#697268',
              fontWeight: 500
            }}
          >
            Loading Scheme Details...
          </Typography>
        </Box>
      </Container>
    );

  if (!meta) return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{
        textAlign: 'center',
        py: 8,
        background: darkMode
          ? 'linear-gradient(135deg, #1a1d1a 0%, #242724 100%)'
          : 'linear-gradient(135deg, #E2E8DD 0%, #F5F7F3 100%)',
        borderRadius: 3,
        p: 4
      }}>
        <Typography
          variant="h5"
          sx={{
            color: darkMode ? '#E2E8DD' : '#4E5340',
            fontWeight: 600,
            mb: 2
          }}
        >
          No scheme data found.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: darkMode ? '#95A3A4' : '#697268'
          }}
        >
          Please check the scheme code and try again.
        </Typography>
      </Box>
    </Container>
  );

  return (
    <Container maxWidth="xl" sx={{
      py: 4,
      width: '100%',
      background: darkMode
        ? 'linear-gradient(135deg, #1a1d1a 0%, #242724 50%)'
        : 'linear-gradient(135deg, #F5F7F3 0%, #E2E8DD 50%)',
      minHeight: '100vh'
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%'
      }}>
        {/* Header Section */}
        <Card sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          boxShadow: darkMode
            ? '0 8px 40px rgba(0, 0, 0, 0.3)'
            : '0 8px 40px rgba(78, 83, 64, 0.15)',
          background: darkMode
            ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
          border: darkMode
            ? '1px solid rgba(78, 83, 64, 0.3)'
            : '1px solid rgba(226, 232, 221, 0.8)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
          }
        }}>
          <CardContent sx={{ p: 0 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography
                  variant="h3"
                  sx={{
                    mb: 2,
                    fontWeight: 700,
                    background: darkMode
                      ? 'linear-gradient(135deg, #E2E8DD 0%, #B7D1DA 100%)'
                      : 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '2rem', md: '2.5rem' }
                  }}
                >
                  {meta.scheme_name}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<AccountBalanceIcon />}
                    label={meta.fund_house}
                    variant="outlined"
                    sx={{
                      color: darkMode ? '#B7D1DA' : '#4E5340',
                      borderColor: darkMode ? '#B7D1DA' : '#4E5340',
                      backgroundColor: darkMode ? 'rgba(183, 209, 218, 0.1)' : 'rgba(78, 83, 64, 0.1)',
                      fontWeight: 600
                    }}
                  />
                  <Chip
                    icon={<CategoryIcon />}
                    label={meta.scheme_category}
                    variant="outlined"
                    sx={{
                      color: darkMode ? '#95A3A4' : '#697268',
                      borderColor: darkMode ? '#95A3A4' : '#697268',
                      backgroundColor: darkMode ? 'rgba(149, 163, 164, 0.1)' : 'rgba(105, 114, 104, 0.1)',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{
                  p: 3,
                  borderRadius: 2,
                  background: darkMode
                    ? 'rgba(78, 83, 64, 0.2)'
                    : 'rgba(226, 232, 221, 0.6)',
                  border: darkMode
                    ? '1px solid rgba(78, 83, 64, 0.4)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                  textAlign: 'center'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <CodeIcon sx={{
                      mr: 1,
                      color: darkMode ? '#B7D1DA' : '#4E5340',
                      fontSize: '1.2rem'
                    }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: darkMode ? '#95A3A4' : '#697268',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      Scheme Code
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: darkMode ? '#E2E8DD' : '#4E5340'
                    }}
                  >
                    {meta.scheme_code}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* NAV Chart Section */}
        <Card sx={calculatorTheme}>
          <CardContent sx={{ p: 3, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{
                mr: 2,
                color: darkMode ? '#B7D1DA' : '#4E5340',
                fontSize: '2rem'
              }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: darkMode ? '#E2E8DD' : '#4E5340'
                }}
              >
                NAV Performance History
              </Typography>
            </Box>
            {/* Limit navHistory to 365 records and reverse it, as in the original code */}
            <NavChart data={navHistory.slice(0, 365).reverse()} />
          </CardContent>
        </Card>

        {/* Calculators Tabbed Section */}
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              textAlign: 'center',
              color: darkMode ? '#E2E8DD' : '#4E5340'
            }}
          >
            Investment Calculators
          </Typography>

          <Card sx={{ ...calculatorTheme, '&:hover': {} }}> {/* Remove hover effect for the main container card */}
            <CardContent sx={{ p: 0 }}>
              <TabContext value={activeCalculator}>
                <Box sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 3,
                  // Custom styling for TabList to center the tabs and ensure responsiveness
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'center',
                  },
                  // Ensure tabs are visible against the background
                  '& .MuiTab-root': {
                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' } // Smaller font size for smaller screens
                  },
                  // Active tab color
                  '& .Mui-selected': {
                    color: darkMode ? '#B7D1DA !important' : '#4E5340 !important',
                  },
                  // Indicator color
                  '& .MuiTabs-indicator': {
                    backgroundColor: darkMode ? '#B7D1DA' : '#4E5340',
                  }
                }}>
                  <TabList
                    onChange={handleCalculatorChange}
                    aria-label="investment calculators tabs"
                    variant="scrollable" // Allows scrolling for many tabs on small screens
                    scrollButtons="auto"
                  >
                    <Tab label="Returns Table" value="returns" icon={<LayersIcon />} iconPosition="start" />
                    <Tab label="SIP" value="sip" icon={<NorthEastIcon />} iconPosition="start" />
                    <Tab label="Step-Up SIP" value="stepup-sip" icon={<TrendingUpIcon />} iconPosition="start" />
                    <Tab label="Lump Sum" value="lumpsum" icon={<SavingsIcon />} iconPosition="start" />
                    <Tab label="SWP" value="swp" icon={<SouthEastIcon />} iconPosition="start" />
                    <Tab label="Step-Up SWP" value="stepup-swp" icon={<TrendingDownIcon />} iconPosition="start" />
                    <Tab label="Rolling Returns" value="rolling" icon={<CompareArrowsIcon />} iconPosition="start" />
                  </TabList>
                </Box>

                <Box sx={{ p: { xs: 2, sm: 3 } }}> {/* Add padding to the panels */}
                  {/* Returns Table */}
                  <TabPanel value="returns" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <ReturnsTable code={meta.scheme_code} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* SIP Calculator */}
                  <TabPanel value="sip" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <SIPCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* Step Up SIP Calculator */}
                  <TabPanel value="stepup-sip" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <StepUpSIPCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* Lump Sum Calculator */}
                  <TabPanel value="lumpsum" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <LumpSumCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* SWP Calculator */}
                  <TabPanel value="swp" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <SWPCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* Step Up SWP Calculator */}
                  <TabPanel value="stepup-swp" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <StepUpSWPCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>

                  {/* Rolling Returns Calculator */}
                  <TabPanel value="rolling" sx={{ p: 0 }}>
                    <Grid container justifyContent="center">
                      <Grid item xs={12} md={10} lg={8}>
                        <Paper sx={{ ...calculatorTheme, p: 3 }}>
                          <RollingReturnsCalculator code={meta.scheme_code} navHistory={navHistory} />
                        </Paper>
                      </Grid>
                    </Grid>
                  </TabPanel>
                </Box>
              </TabContext>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
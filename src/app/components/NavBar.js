"use client";

import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import CalculateIcon from '@mui/icons-material/Calculate';
import PaidIcon from '@mui/icons-material/Paid';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Navbar({ darkMode, setDarkMode }) {
  return (
    <AppBar 
      position="static" 
      elevation={2}
      sx={{ 
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1d1a 0%, #242724 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F5F7F3 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: darkMode 
          ? '1px solid rgba(78, 83, 64, 0.2)' 
          : '1px solid rgba(226, 232, 221, 0.8)',
      }}
    >
      <Toolbar className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Left Section: Logo */}
        <Box className="flex items-center gap-6">
          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{ 
              textDecoration: 'none', 
              fontWeight: 800,
              background: darkMode
                ? 'linear-gradient(135deg, #E2E8DD 0%, #B7D1DA 100%)'
                : 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                transform: 'scale(1.02)',
                transition: 'transform 0.2s ease',
              }
            }}
          >
            <PaidIcon 
              sx={{ 
                mr: 1, 
                fontSize: '1.4em',
                color: darkMode ? '#B7D1DA' : '#4E5340'
              }} 
            />
            WealthGrove
          </Typography>
        </Box>

        {/* Center Section: Navigation Links */}
        <Box 
          sx={{ 
            flex: 1, 
            display: { xs: 'none', md: 'flex' }, 
            justifyContent: 'center',
            gap: 4
          }}
        >
          <Button
            component={Link}
            href="/funds"
            startIcon={<TrendingUpIcon />}
            sx={{
              color: darkMode ? '#E2E8DD' : '#4E5340',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(183, 209, 218, 0.1)' 
                  : 'rgba(78, 83, 64, 0.08)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Explore Funds
          </Button>

          <Button
            component={Link}
            href="/virtual-portfolio"
            startIcon={<CalculateIcon />}
            sx={{
              color: darkMode ? '#E2E8DD' : '#4E5340',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(183, 209, 218, 0.1)' 
                  : 'rgba(78, 83, 64, 0.08)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            My Portfolios
          </Button>

          <Button
            component={Link}
            href="/watchlist"
            startIcon={<AnalyticsIcon />}
            sx={{
              color: darkMode ? '#E2E8DD' : '#4E5340',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(183, 209, 218, 0.1)' 
                  : 'rgba(78, 83, 64, 0.08)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Watchlist
          </Button>
        </Box>

        {/* Right Section: Theme Toggle & CTA */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Theme Toggle Button */}
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            sx={{
              color: darkMode ? '#E2E8DD' : '#4E5340',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(183, 209, 218, 0.1)' 
                  : 'rgba(78, 83, 64, 0.08)',
              }
            }}
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Button 
            component={Link} 
            href="/funds"
            variant="contained"
            startIcon={<TrendingUpIcon />}
            size="large"
            sx={{ 
              fontWeight: 700,
              fontSize: '0.95rem',
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
              color: '#E2E8DD',
              borderRadius: 3,
              boxShadow: darkMode
                ? '0 4px 20px rgba(78, 83, 64, 0.4)'
                : '0 4px 20px rgba(78, 83, 64, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #3a3e30 0%, #565b4d 100%)',
                transform: 'translateY(-2px)',
                boxShadow: darkMode
                  ? '0 6px 25px rgba(78, 83, 64, 0.5)'
                  : '0 6px 25px rgba(78, 83, 64, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Start Investing
          </Button>
        </Box>
      </Toolbar>

      {/* Mobile Navigation */}
      <Box 
        sx={{ 
          display: { xs: 'flex', md: 'none' }, 
          justifyContent: 'center', 
          gap: 1,
          py: 1,
          borderTop: darkMode 
            ? '1px solid rgba(78, 83, 64, 0.2)' 
            : '1px solid rgba(226, 232, 221, 0.8)',
        }}
      >
        <Button
          component={Link}
          href="/funds"
          size="small"
          sx={{
            color: darkMode ? '#E2E8DD' : '#4E5340',
            fontWeight: 600,
            fontSize: '0.8rem',
            minWidth: 'auto',
            px: 2,
          }}
        >
          Funds
        </Button>

        <Button
          component={Link}
          href="/calculator"
          size="small"
          sx={{
            color: darkMode ? '#E2E8DD' : '#4E5340',
            fontWeight: 600,
            fontSize: '0.8rem',
            minWidth: 'auto',
            px: 2,
          }}
        >
          Calculator
        </Button>

        <Button
          component={Link}
          href="/analytics"
          size="small"
          sx={{
            color: darkMode ? '#E2E8DD' : '#4E5340',
            fontWeight: 600,
            fontSize: '0.8rem',
            minWidth: 'auto',
            px: 2,
          }}
        >
          Analytics
        </Button>
      </Box>
    </AppBar>
  );
}
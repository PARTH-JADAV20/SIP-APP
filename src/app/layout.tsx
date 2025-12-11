"use client";

import React from 'react';
import './globals.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navbar from '../app/components/NavBar';
import { useMediaQuery, IconButton } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { SnackbarProvider } from 'notistack';
import ErrorBoundary from '../app/components/ErrorBoundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = React.useState(false);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#4E5340',
            light: '#697268',
            dark: '#3a3e30',
          },
          secondary: {
            main: '#95A3A4',
            light: '#B7D1DA',
            dark: '#7a8a8b',
          },
          background: {
            default: darkMode ? '#1a1d1a' : '#F5F7F3',
            paper: darkMode ? '#242724' : '#FFFFFF',
          },
          text: {
            primary: darkMode ? '#E2E8DD' : '#2a2d2a',
            secondary: darkMode ? '#95A3A4' : '#4E5340',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 700,
            color: darkMode ? '#E2E8DD' : '#4E5340',
          },
          h2: {
            fontWeight: 700,
            color: darkMode ? '#E2E8DD' : '#4E5340',
          },
          h3: {
            fontWeight: 600,
            color: darkMode ? '#E2E8DD' : '#4E5340',
          },
          h4: {
            fontWeight: 600,
            color: darkMode ? '#E2E8DD' : '#697268',
          },
          h5: {
            fontWeight: 600,
            color: darkMode ? '#E2E8DD' : '#697268',
          },
          h6: {
            fontWeight: 600,
            color: darkMode ? '#E2E8DD' : '#697268',
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                textTransform: 'none',
                fontWeight: 600,
                padding: '10px 24px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(78, 83, 64, 0.3)',
                },
              },
              containedPrimary: {
                background: 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
                color: '#E2E8DD',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3a3e30 0%, #565b4d 100%)',
                },
              },
              outlinedPrimary: {
                borderColor: '#4E5340',
                color: '#4E5340',
                '&:hover': {
                  backgroundColor: 'rgba(78, 83, 64, 0.08)',
                  borderColor: '#3a3e30',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: darkMode
                  ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                  : '0 4px 25px rgba(78, 83, 64, 0.1)',
                border: darkMode ? '1px solid #2a2e2a' : '1px solid #E2E8DD',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode
                    ? '0 8px 30px rgba(0, 0, 0, 0.3)'
                    : '0 8px 35px rgba(78, 83, 64, 0.15)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? '#1a1d1a' : '#FFFFFF',
                color: darkMode ? '#E2E8DD' : '#4E5340',
                borderBottom: darkMode ? '1px solid #2a2e2a' : '1px solid #E2E8DD',
                boxShadow: '0 2px 20px rgba(78, 83, 64, 0.1)',
              },
            },
          },
        },
      }),
    [darkMode],
  );

  return (
    <html lang="en">
      <head />
      <body style={{ backgroundColor: darkMode ? '#1a1d1a' : '#F5F7F3' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div className="min-h-screen flex flex-col">
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="container mx-auto px-4 py-6 flex-1 max-w-7xl">
              <ErrorBoundary>
                <SnackbarProvider maxSnack={3}>
                  {children}
                </SnackbarProvider>
              </ErrorBoundary>
            </main>
            <footer
              className={`border-t p-6 text-center text-sm ${darkMode
                ? 'bg-[#1a1d1a] border-[#2a2e2a] text-[#95A3A4]'
                : 'bg-[#E2E8DD] border-[#d1d9c7] text-[#4E5340]'
                }`}
            >
              <div className="max-w-7xl mx-auto">
                <p>Mutual Fund Explorer — Your trusted partner in investment growth</p>
                <p className="mt-2 text-xs opacity-70">© 2024 All rights reserved</p>
              </div>
            </footer>
          </div>
        </ThemeProvider>

      </body>
    </html>
  );
}
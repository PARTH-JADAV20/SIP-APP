'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Savings as SIPIcon,
  Paid as LumpsumIcon
} from '@mui/icons-material';
import SIPForm from './SIPForm';

export default function InvestButton({ schemeCode, schemeName, portfolioId }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [sipDialogOpen, setSipDialogOpen] = useState(false);
  const [lumpsumDialogOpen, setLumpsumDialogOpen] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  // In InvestButton.js
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(portfolioId || null);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // In InvestButton.js, update the handleSIPClick function
  const handleSIPClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/virtual-portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      const portfolios = await res.json();

      if (portfolios.length === 0) {
        // If no portfolio exists, create one automatically
        const createRes = await fetch('/api/virtual-portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolioName: `${schemeName} Portfolio`,
            startingBalance: 100000,
            initialInvestment: {
              schemeCode,
              schemeName,
              amount: 0, // Will be updated after SIP creation
              date: new Date().toISOString()
            }
          })
        });

        let newPortfolio;
        try {
          newPortfolio = await createRes.json();
        } catch {
          throw new Error('Portfolio creation failed: Invalid response');
        }
        setPortfolios([newPortfolio]);
        setSelectedPortfolioId(newPortfolio._id);
        setSipDialogOpen(true);
      } else if (portfolios.length === 1) {
        setPortfolios(portfolios);
        setSelectedPortfolioId(portfolios[0]._id);
        setSipDialogOpen(true);
      } else {
        setPortfolios(portfolios);
        setPortfolioDialogOpen(true);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to set up portfolio', { variant: 'error' });
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleLumpsumClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/virtual-portfolio');
      if (!res.ok) throw new Error('Failed to fetch portfolios');
      const data = await res.json();
      setPortfolios(data);
      setLumpsumDialogOpen(true);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to load portfolios', { variant: 'error' });
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleSIPSuccess = (portfolioId) => {
    setSipDialogOpen(false);
    enqueueSnackbar('SIP created successfully!', { variant: 'success' });
    router.push(`/virtual-portfolio/${portfolioId}`);
  };

  const handleLumpsumSuccess = (portfolioId) => {
    setLumpsumDialogOpen(false);
    enqueueSnackbar('Investment successful!', { variant: 'success' });
    router.push(`/virtual-portfolio/${portfolioId}`);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Invest'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSIPClick}>
          <ListItemIcon>
            <SIPIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Start SIP" secondary="Systematic Investment Plan" />
        </MenuItem>
        <MenuItem onClick={handleLumpsumClick}>
          <ListItemIcon>
            <LumpsumIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="One-Time Investment" secondary="Lump Sum Investment" />
        </MenuItem>
      </Menu>

      {/* Portfolio selection dialog */}
      <Dialog open={portfolioDialogOpen} onClose={() => setPortfolioDialogOpen(false)}>
        <DialogTitle>Select a Portfolio</DialogTitle>
        <DialogContent>
          {portfolios.map((p) => (
            <MenuItem
              key={p._id}
              selected={selectedPortfolioId === p._id}
              onClick={() => {
                setSelectedPortfolioId(p._id);
                setPortfolioDialogOpen(false);
                setSipDialogOpen(true);
              }}
            >
              <ListItemText primary={p.portfolioName} />
            </MenuItem>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <SIPForm
        open={sipDialogOpen}
        onClose={(success) => {
          setSipDialogOpen(false);
          if (success) {
            handleSIPSuccess(selectedPortfolioId);
          }
        }}
        schemeCode={schemeCode}
        schemeName={schemeName}
        portfolioId={selectedPortfolioId}
      />

      {/* Lumpsum investment dialog would go here */}
    </>
  );
}

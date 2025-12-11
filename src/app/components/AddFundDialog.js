'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function AddFundDialog({ open, onClose, onAdd, portfolioId }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [amount, setAmount] = useState('');
  const [nav, setNav] = useState('');
  const [date, setDate] = useState(new Date());
  const [units, setUnits] = useState('');

  useEffect(() => {
    if (!searchTerm) {
      setSchemes([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/virtual-portfolio/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        setSchemes(data);
      } catch (error) {
        console.error('Error searching schemes:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedScheme || !amount || !date) return;

    try {
      const response = await fetch(`/api/virtual-portfolio/${portfolioId}/funds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemeCode: selectedScheme.schemeCode,
          schemeName: selectedScheme.schemeName,
          amount: parseFloat(amount),
          nav: parseFloat(nav) || 0,
          date: date.toISOString().split('T')[0],
          units: parseFloat(units) || 0,
        }),
      });

      const newFund = await response.json();
      onAdd(newFund);
      handleClose();
    } catch (error) {
      console.error('Error adding fund:', error);
    }
  };

  const handleClose = () => {
    setSelectedScheme(null);
    setAmount('');
    setNav('');
    setDate(new Date());
    setUnits('');
    setSearchTerm('');
    onClose();
  };

  const calculateUnits = (amount, nav) => {
    if (!amount || !nav) return '';
    const calculatedUnits = parseFloat(amount) / parseFloat(nav);
    return isNaN(calculatedUnits) ? '' : calculatedUnits.toFixed(4);
  };

  useEffect(() => {
    if (amount && nav) {
      setUnits(calculateUnits(amount, nav));
    }
  }, [amount, nav]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Fund</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box mb={2}>
            <Autocomplete
              options={schemes}
              getOptionLabel={(option) => option.schemeName}
              loading={loading}
              value={selectedScheme}
              onChange={(_, newValue) => {
                setSelectedScheme(newValue);
                if (newValue?.nav) {
                  setNav(newValue.nav.toString());
                }
              }}
              onInputChange={(_, newInputValue) => {
                setSearchTerm(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Mutual Fund"
                  variant="outlined"
                  fullWidth
                  required
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={searchTerm ? "No schemes found" : "Start typing to search..."}
            />
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Investment Date"
              value={date}
              onChange={(newValue) => setDate(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  required
                />
              )}
            />
          </LocalizationProvider>

          <TextField
            label="Amount (₹)"
            type="number"
            fullWidth
            margin="normal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            inputProps={{ min: "0", step: "0.01" }}
          />

          <TextField
            label="NAV (₹)"
            type="number"
            fullWidth
            margin="normal"
            value={nav}
            onChange={(e) => setNav(e.target.value)}
            inputProps={{ min: "0", step: "0.0001" }}
          />

          <TextField
            label="Units"
            type="number"
            fullWidth
            margin="normal"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            inputProps={{ min: "0", step: "0.0001" }}
            disabled={!nav}
          />

          {selectedScheme && (
            <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Scheme:</strong> {selectedScheme.schemeName}
              </Typography>
              {selectedScheme.category && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {selectedScheme.category}
                </Typography>
              )}
              {selectedScheme.fundHouse && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Fund House:</strong> {selectedScheme.fundHouse}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!selectedScheme || !amount || !date}
          >
            Add Fund
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
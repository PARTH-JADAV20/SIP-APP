'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';

export default function SIPForm({ open, onClose, schemeCode, schemeName, portfolioId }) {
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // In SIPForm.js
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || isNaN(amount) || amount < 500) {
      setError('Minimum SIP amount is ₹500');
      return;
    }

    if (!portfolioId) {
      setError('No portfolio selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In SIPForm.js, update the API call
      const response = await fetch('/api/sip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          schemeCode,
          schemeName,
          amount: parseFloat(amount),
          dayOfMonth: parseInt(dayOfMonth, 10),
          initialInvestment: true // Flag for first investment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create SIP');
      }

      // Call onClose with true to indicate success
      onClose(true);
    } catch (err) {
      console.error('Error creating SIP:', err);
      setError(err.message || 'Failed to create SIP');
    } finally {
      setLoading(false);
    }
  };

  // Generate day options (1-28)
  const dayOptions = [];
  for (let i = 1; i <= 28; i++) {
    dayOptions.push(
      <MenuItem key={i} value={i}>
        {i} {i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} of each month
      </MenuItem>
    );
  }

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Start SIP in {schemeName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Monthly Investment (₹)"
              type="number"
              fullWidth
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 500, step: 500 }}
              required
              disabled={loading}
              helperText="Minimum amount is ₹500"
            />
          </Box>

          <Box sx={{ mt: 3, mb: 2 }}>
            <FormControl fullWidth variant="outlined" disabled={loading}>
              <InputLabel>Debit Day</InputLabel>
              <Select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                label="Debit Day"
                required
              >
                {dayOptions}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              The amount will be debited from your portfolio on this day each month.
            </Typography>
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => !loading && onClose()} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !amount}
          >
            {loading ? <CircularProgress size={24} /> : 'Start SIP'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';

export default function CreatePortfolioDialog({ open, onClose, onSubmit }) {
  const [portfolioName, setPortfolioName] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [investmentFrequency, setInvestmentFrequency] = useState('MONTHLY');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!portfolioName.trim()) {
      newErrors.portfolioName = 'Portfolio name is required';
    }
    
    if (initialInvestment && isNaN(parseFloat(initialInvestment))) {
      newErrors.initialInvestment = 'Please enter a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const portfolioData = {
      portfolioName: portfolioName.trim(),
      ...(initialInvestment && { 
        initialInvestment: parseFloat(initialInvestment) 
      }),
      startDate: startDate.toISOString().split('T')[0],
      investmentFrequency
    };

    onSubmit(portfolioData);
    handleClose();
  };

  const handleClose = () => {
    setPortfolioName('');
    setInitialInvestment('');
    setStartDate(new Date());
    setInvestmentFrequency('MONTHLY');
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create New Portfolio</Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleClose} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          autoFocus
          margin="normal"
          label="Portfolio Name"
          type="text"
          fullWidth
          variant="outlined"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          error={!!errors.portfolioName}
          helperText={errors.portfolioName}
          required
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />
            )}
          />
        </LocalizationProvider>

        <TextField
          label="Initial Investment (Optional)"
          type="number"
          fullWidth
          margin="normal"
          value={initialInvestment}
          onChange={(e) => setInitialInvestment(e.target.value)}
          error={!!errors.initialInvestment}
          helperText={errors.initialInvestment}
          InputProps={{
            startAdornment: '₹',
          }}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
          <InputLabel id="frequency-label" shrink>Investment Frequency</InputLabel>
          <Select
            labelId="frequency-label"
            id="frequency"
            value={investmentFrequency}
            label="Investment Frequency"
            onChange={(e) => setInvestmentFrequency(e.target.value)}
            displayEmpty
            notched
          >
            <MenuItem value="MONTHLY">Monthly</MenuItem>
            <MenuItem value="QUARTERLY">Quarterly</MenuItem>
            <MenuItem value="HALF_YEARLY">Half Yearly</MenuItem>
            <MenuItem value="YEARLY">Yearly</MenuItem>
            <MenuItem value="ONE_TIME">One Time</MenuItem>
          </Select>
          <FormHelperText>How often will you add funds to this portfolio?</FormHelperText>
        </FormControl>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={!portfolioName.trim()}
        >
          Create Portfolio
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CreatePortfolioDialog.defaultProps = {
  open: false,
  onClose: () => {},
  onSubmit: () => {},
};
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import AddFundDialog from '@/app/components/AddFundDialog';
import PerformanceMetrics from '@/app/components/PerformanceMetrics';
import PortfolioChart from '@/app/components/PortfolioChart';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export default function PortfolioDetailPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addFundOpen, setAddFundOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/virtual-portfolio/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        const data = await response.json();
        setPortfolio(data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Failed to load portfolio',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    if (id) {
      fetchPortfolio();
    }else{
      setLoading(false);
    }
  }, [id]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleUpdatePortfolio = async () => {
    try {
      const response = await fetch(`/api/virtual-portfolio/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ portfolioName }),
      });

      const updatedPortfolio = await response.json();
      setPortfolio(updatedPortfolio);
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Portfolio updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating portfolio:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update portfolio',
        severity: 'error'
      });
    }
  };

  const handleDeletePortfolio = async () => {
    try {
      await fetch(`/api/virtual-portfolio/${id}`, {
        method: 'DELETE',
      });
      setDeleteDialogOpen(false);
      router.push('/virtual-portfolio');
      setSnackbar({
        open: true,
        message: 'Portfolio deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete portfolio',
        severity: 'error'
      });
    }
  };

  const handleAddFund = (newFund) => {
    setPortfolio(prev => ({
      ...prev,
      funds: [...prev.funds, newFund],
      totalInvested: prev.totalInvested + newFund.amount,
      currentValue: prev.currentValue + (newFund.units * newFund.nav)
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!portfolio) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">Portfolio not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => router.back()} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {portfolio.portfolioName}
          </Typography>
        </Box>
        <Box>  
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEditClick}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Edit Portfolio
            </MenuItem>
            <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete Portfolio
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <PerformanceMetrics portfolio={portfolio} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" icon={<BarChartIcon />} iconPosition="start" />
          <Tab label="Performance" icon={<ShowChartIcon />} iconPosition="start" />
          <Tab label="Allocation" icon={<PieChartIcon />} iconPosition="start" />
          <Tab label="Transactions" icon={<AttachMoneyIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box>
          <PortfolioChart portfolio={portfolio} />
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {portfolio.funds.map((fund, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {fund.schemeName}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={fund.gainLoss >= 0 ? 'success.main' : 'error.main'}
                    >
                      {fund.gainLoss >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                      {formatPercentage(fund.gainLossPercentage)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Invested: {formatCurrency(fund.amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current: {formatCurrency(fund.currentValue)}
                  </Typography>
                  <Box mt={1} pt={1} borderTop={1} borderColor="divider">
                    <Typography variant="caption" color="text.secondary">
                      {fund.units.toFixed(4)} units @ {formatCurrency(fund.nav)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Performance Over Time
          </Typography>
          <Box height={400}>
            {/* Performance chart will be rendered here */}
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">Performance chart coming soon</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Asset Allocation
          </Typography>
          <Box height={400}>
            {/* Allocation chart will be rendered here */}
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">Allocation chart coming soon</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Transaction History
          </Typography>
          {portfolio.funds.map((fund, index) => (
            <Paper key={index} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                {fund.schemeName}
              </Typography>
              {fund.transactions && fund.transactions.length > 0 ? (
                <Box>
                  {fund.transactions.map((txn, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < fund.transactions.length - 1 ? 1 : 0,
                        borderColor: 'divider'
                      }}
                    >
                      <Box>
                        <Typography variant="body2">
                          {new Date(txn.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {txn.type === 'BUY' ? 'Purchase' : 'Sell'}: {txn.units} units
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(txn.amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          NAV: {formatCurrency(txn.nav)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No transactions found
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <AddFundDialog
        open={addFundOpen}
        onClose={() => setAddFundOpen(false)}
        onAdd={handleAddFund}
        portfolioId={id}
      />

      {/* Edit Portfolio Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            type="text"
            fullWidth
            variant="outlined"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdatePortfolio}
            variant="contained"
            color="primary"
            disabled={!portfolioName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Portfolio</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{portfolio.portfolioName}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeletePortfolio}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
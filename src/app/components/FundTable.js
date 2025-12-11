'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  InfoOutlined as InfoOutlinedIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils/format';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'schemeName', numeric: false, label: 'Fund Name' },
  { id: 'type', numeric: false, label: 'Type' },
  { id: 'amount', numeric: true, label: 'Invested' },
  { id: 'currentValue', numeric: true, label: 'Current Value' },
  { id: 'gainLoss', numeric: true, label: 'Returns' },
  { id: 'xirr', numeric: true, label: 'XIRR' },
  { id: 'actions', numeric: false, label: 'Actions' },
];

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => {
          if (isMobile && ['type', 'xirr'].includes(headCell.id)) {
            return null;
          }
          return (
            <TableCell
              key={headCell.id}
              align={headCell.numeric ? 'right' : 'left'}
              sortDirection={orderBy === headCell.id ? order : false}
              sx={{ fontWeight: 'bold' }}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

function getRiskColor(risk) {
  switch (risk?.toLowerCase()) {
    case 'high':
      return 'error.main';
    case 'moderate':
      return 'warning.main';
    case 'low':
      return 'success.main';
    default:
      return 'text.secondary';
  }
}

function FundTable({ 
  funds = [], 
  onEdit, 
  onDelete, 
  onAdd, 
  loading = false,
  showPortfolioName = false,
  portfolioId 
}) {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('schemeName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFundToDelete, setSelectedFundToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMenuClick = (event, fund) => {
    setAnchorEl(event.currentTarget);
    setSelectedFund(fund);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFund(null);
  };

  const handleEditClick = () => {
    if (onEdit && selectedFund) {
      onEdit(selectedFund);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setSelectedFundToDelete(selectedFund);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (onDelete && selectedFundToDelete) {
      setDeleteLoading(true);
      try {
        await onDelete(selectedFundToDelete._id);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting fund:', error);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedFundToDelete(null);
  };

  const filteredFunds = useMemo(() => {
    return funds.filter((fund) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        fund.schemeName.toLowerCase().includes(searchLower) ||
        fund.schemeCode.toLowerCase().includes(searchLower) ||
        fund.type.toLowerCase().includes(searchLower) ||
        (fund.category && fund.category.toLowerCase().includes(searchLower))
      );
    });
  }, [funds, searchTerm]);

  const sortedAndFilteredFunds = useMemo(() => {
    return stableSort(filteredFunds, getComparator(order, orderBy));
  }, [filteredFunds, order, orderBy]);

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - sortedAndFilteredFunds.length) : 0;

  const visibleRows = useMemo(() => {
    return sortedAndFilteredFunds.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedAndFilteredFunds, page, rowsPerPage]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search funds..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        {onAdd && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            Add Fund
          </Button>
        )}
      </Box>

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={sortedAndFilteredFunds.length}
            />
            <TableBody>
              {visibleRows.map((fund, index) => {
                const isPositive = fund.gainLoss >= 0;
                const isXirrPositive = fund.xirr >= 0;
                
                return (
                  <TableRow
                    hover
                    key={fund._id || index}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="body2" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center' }}>
                          {fund.schemeName}
                          {fund.risk && (
                            <Tooltip title={`Risk: ${fund.risk}`} arrow>
                              <Box
                                component="span"
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: getRiskColor(fund.risk),
                                  ml: 1,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          {fund.schemeCode}
                          <Tooltip title="View fund details">
                            <IconButton size="small" sx={{ p: 0, ml: 0.5, color: 'text.secondary' }}>
                              <InfoOutlinedIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    {!isMobile && (
                      <TableCell>
                        <Chip
                          label={fund.type}
                          size="small"
                          variant="outlined"
                          color={fund.type === 'SIP' ? 'primary' : 'secondary'}
                          sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    )}
                    
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(fund.amount)}
                      </Typography>
                      {fund.sipAmount > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {fund.type === 'SIP' ? `₹${fund.sipAmount}/mo` : 'Lump Sum'}
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(fund.currentValue)}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={isPositive ? 'success.main' : 'error.main'}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                      >
                        {isPositive ? (
                          <ArrowUpwardIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        ) : (
                          <ArrowDownwardIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                        )}
                        {formatPercentage(fund.gainLossPercentage)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {fund.xirr !== undefined ? (
                          <>
                            <Typography 
                              variant="body2" 
                              color={isXirrPositive ? 'success.main' : 'error.main'}
                              sx={{ 
                                fontWeight: 'medium',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {isXirrPositive ? (
                                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                              ) : (
                                <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                              )}
                              {formatPercentage(Math.abs(fund.xirr))}
                            </Typography>
                            <Tooltip title="XIRR (Extended Internal Rate of Return) is the rate at which your investment grows annually, considering the timing and amount of cash flows.">
                              <InfoOutlinedIcon 
                                fontSize="small" 
                                sx={{ 
                                  ml: 0.5, 
                                  color: 'text.secondary',
                                  cursor: 'help'
                                }} 
                              />
                            </Tooltip>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, fund)}
                        aria-label="fund actions"
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={headCells.length} />
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {sortedAndFilteredFunds.length === 0 && (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              p={4}
              minHeight={200}
            >
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No funds found
              </Typography>
              {onAdd && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={onAdd}
                  sx={{ mt: 2 }}
                >
                  Add Your First Fund
                </Button>
              )}
            </Box>
          )}
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={sortedAndFilteredFunds.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Fund</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedFundToDelete?.schemeName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

FundTable.defaultProps = {
  funds: [],
  loading: false,
  showPortfolioName: false,
  onEdit: null,
  onDelete: null,
  onAdd: null,
  portfolioId: null
};

export default FundTable;
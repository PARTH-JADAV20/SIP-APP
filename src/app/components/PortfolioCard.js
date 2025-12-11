'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Skeleton
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export default function PortfolioCard({ portfolio, onView, onEdit, onDelete, loading }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  const handleEdit = (event) => {
    handleClose(event);
    if (onEdit) onEdit(portfolio);
  };

  const handleDelete = (event) => {
    handleClose(event);
    if (onDelete) onDelete(portfolio);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', cursor: 'pointer' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Skeleton variant="text" width="45%" height={20} />
            <Skeleton variant="text" width="45%" height={20} />
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Skeleton variant="text" width="45%" height={20} />
            <Skeleton variant="text" width="45%" height={20} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const isPositive = portfolio.gainLossPercentage >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        }
      }}
      onClick={() => onView(portfolio._id)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" component="div" noWrap>
              {portfolio.portfolioName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {portfolio.funds?.length || 0} funds
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
            aria-label="more"
            aria-controls="portfolio-menu"
            aria-haspopup="true"
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="portfolio-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            onClick={(e) => e.stopPropagation()}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ShowChartIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
            {onEdit && (
              <MenuItem onClick={handleEdit}>
                <ShowChartIcon fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem
                onClick={handleDelete}
                sx={{ color: 'error.main' }}
              >
                <AttachMoneyIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            )}
          </Menu>
        </Box>

        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Current Value
            </Typography>
            <Typography variant="subtitle1" fontWeight="medium">
              {formatCurrency(portfolio.currentValue || 0)}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Invested
            </Typography>
            <Typography variant="body2">
              {formatCurrency(portfolio.totalInvested || 0)}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Returns
            </Typography>
            <Box display="flex" alignItems="center">
              {isPositive ? (
                <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
              )}
              <Typography
                variant="body2"
                color={isPositive ? 'success.main' : 'error.main'}
                fontWeight="medium"
              >
                {formatPercentage(portfolio.gainLossPercentage || 0)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

PortfolioCard.defaultProps = {
  loading: false,
  onView: () => { },
  onEdit: null,
  onDelete: null,
};
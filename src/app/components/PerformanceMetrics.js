'use client';

import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  useTheme,
  LinearProgress,
  alpha,
} from '@mui/material';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

function MetricItem({
  label,
  value,
  subValue,
  tooltip,
  isPositive,
  showTrend = false,
  progress,
  isCurrency = false,
}) {
  const theme = useTheme();
  const color = isPositive !== undefined ? 
    (isPositive ? 'success.main' : 'error.main') : 
    'text.primary';
  
  return (
    <Box mb={2.5}>
      <Box display="flex" alignItems="center" mb={0.5}>
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mr: 1
          }}
        >
          {label}
          {tooltip && (
            <Tooltip title={tooltip} arrow>
              <InfoOutlinedIcon 
                sx={{ 
                  ml: 0.5, 
                  fontSize: '0.9rem',
                  color: 'text.secondary',
                  opacity: 0.7
                }} 
              />
            </Tooltip>
          )}
        </Typography>
      </Box>
      
      <Box display="flex" alignItems="center">
        <Typography 
          variant="h6" 
          color={color}
          sx={{ 
            fontWeight: 600,
            lineHeight: 1.2,
            mr: 1
          }}
        >
          {isCurrency ? formatCurrency(value) : value}
        </Typography>
        
        {showTrend && (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              color: color,
              fontSize: '0.9rem',
              fontWeight: 500,
              '& svg': {
                fontSize: '1.1rem',
                ml: 0.5
              }
            }}
          >
            {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          </Box>
        )}
      </Box>
      
      {subValue !== undefined && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block',
            mt: 0.25,
            fontSize: '0.75rem'
          }}
        >
          {typeof subValue === 'number' && subValue >= 0 ? `+${subValue}` : subValue}
        </Typography>
      )}
      
      {progress !== undefined && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(Math.max(progress, 0), 100)} 
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
              }
            }} 
          />
        </Box>
      )}
    </Box>
  );
}

export default MetricItem;
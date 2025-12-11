"use client";

import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { AccountBalance } from '@mui/icons-material';
import { Box } from '@mui/material';

export default function FundCard({ scheme }) {
  const { schemeCode, schemeName, fundHouse } = scheme;
  return (
    <Card sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      boxShadow: 2,
      '&:hover': { 
        boxShadow: 6,
        transform: 'translateY(-4px)'
      },
      transition: 'all 0.3s ease'
    }}>
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        p: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 1.5 
        }}>
          <AccountBalance color="primary" />
          <Typography 
            variant="subtitle2" 
            color="primary" 
            sx={{ fontWeight: 500 }}
          >
            {fundHouse}
          </Typography>
        </Box>
        
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
            height: '2.6em' // Fixed height for 2 lines
          }}
        >
          {schemeName}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            bgcolor: 'action.hover', 
            color: 'text.secondary',
            px: 1.5, 
            py: 0.5, 
            borderRadius: 10,
            alignSelf: 'flex-start',
            mb: 1
          }}
        >
          Code: {schemeCode}
        </Typography>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
        <Button 
          component={Link} 
          href={`/scheme/${schemeCode}`} 
          variant="contained" 
          fullWidth
          sx={{ 
            py: 1,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.02)' }
          }}
        >
          View Details
        </Button>
      </Box>
    </Card>
  );
}
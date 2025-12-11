'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function PortfolioChart({ portfolio }) {
  // Sample data - replace with your actual portfolio data
  const chartData = [
    { name: 'Jan', value: 10000 },
    { name: 'Feb', value: 15000 },
    { name: 'Mar', value: 12000 },
    { name: 'Apr', value: 18000 },
    { name: 'May', value: 20000 },
    { name: 'Jun', value: portfolio?.currentValue || 0 },
  ];

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Portfolio Growth
      </Typography>
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name="Portfolio Value" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

PortfolioChart.defaultProps = {
  portfolio: null,
};
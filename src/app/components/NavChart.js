"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Typography from '@mui/material/Typography';
import { useTheme, Box } from '@mui/material';

export default function NavChart({ data }) {
  const theme = useTheme();
  // data expected: [{date: 'YYYY-MM-DD', nav: '12.3456'}, ...] reversed chronologically
  const chartData = (data || []).map(d => ({ date: d.date, nav: parseFloat(d.nav) }));

  return (
    <Box sx={{ width: '100%', height: 350, p: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.text.secondary, textAlign: 'center' }}>
        NAV History (last {chartData.length} points)
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            minTickGap={50} 
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          />
          <YAxis 
            domain={[dataMin => Math.floor(dataMin - 5), 'auto']} 
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            width={80}
          />
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff'
            }}
            formatter={(value) => [`₹${value.toFixed(4)}`, 'NAV']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="nav" 
            name="NAV Value" 
            stroke={theme.palette.primary.main} 
            dot={false} 
            strokeWidth={2} 
            activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 1, fill: theme.palette.background.paper }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
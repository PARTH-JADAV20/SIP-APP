"use client";
import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box, useTheme } from '@mui/material';

export default function ReturnsTable({ code }) {
    const [rows, setRows] = useState([]);
    const theme = useTheme();

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const urls = [
                    `/api/scheme/${code}/returns?period=1m`,
                    `/api/scheme/${code}/returns?period=3m`,
                    `/api/scheme/${code}/returns?period=6m`,
                    `/api/scheme/${code}/returns?period=1y`
                ];
                
                const responses = await Promise.all(urls.map(url => fetch(url)));
                const data = await Promise.all(responses.map(res => res.json()));

                if (!mounted) return;

                const [r1, r3, r6, r1y] = data;

                setRows([
                    { label: '1 month', ...r1 },
                    { label: '3 months', ...r3 },
                    { label: '6 months', ...r6 },
                    { label: '1 year', ...r1y },
                ]);
            } catch (err) {
                console.error("Error loading scheme returns:", err);
            }
        }
        if (code) load();
        return () => { mounted = false; };
    }, [code]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>Precomputed Returns</Typography>
            <Box sx={{ flex: 1, width: '100%', overflow: 'auto' }}>
                <Table sx={{ 
                    width: '100%',
                    minWidth: '800px', // Ensure table has minimum width
                    '& .MuiTableCell-root': { 
                        py: 1,
                        px: 1,
                        textAlign: 'center',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        fontSize: '0.875rem'
                    } 
                }}>
                    <TableHead>
                        <TableRow sx={{ 
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(50,50,50,0.5)' : 'rgba(240,240,240,0.5)',
                            '& th': { 
                                fontWeight: 600,
                                textAlign: 'center',
                                fontSize: '0.875rem',
                                py: 2
                            }
                        }}>
                            <TableCell sx={{ minWidth: '120px' }}>Period</TableCell>
                            <TableCell sx={{ minWidth: '100px' }}>Start Date</TableCell>
                            <TableCell sx={{ minWidth: '100px' }}>End Date</TableCell>
                            <TableCell sx={{ minWidth: '100px' }}>Start NAV</TableCell>
                            <TableCell sx={{ minWidth: '100px' }}>End NAV</TableCell>
                            <TableCell sx={{ minWidth: '120px' }}>Simple Return</TableCell>
                            <TableCell sx={{ minWidth: '140px' }}>Annualized Return</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((r, index) => {
                            const simple = Number(r.simpleReturn);
                            const annualized = r.annualizedReturn ? Number(r.annualizedReturn) : NaN;

                            return (
                                <TableRow key={r.label} sx={{
                                    bgcolor: index % 2 === 0 
                                        ? theme.palette.mode === 'dark' 
                                            ? 'rgba(50,50,50,0.1)' 
                                            : 'rgba(240,240,240,0.1)'
                                        : 'transparent',
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(60,60,60,0.2)' : 'rgba(230,230,230,0.2)'
                                    }
                                }}>
                                    <TableCell sx={{ fontWeight: 500, textAlign: 'left', minWidth: '120px' }}>{r.label}</TableCell>
                                    <TableCell sx={{ minWidth: '100px' }}>{r.startDate || '-'}</TableCell>
                                    <TableCell sx={{ minWidth: '100px' }}>{r.endDate || '-'}</TableCell>
                                    <TableCell sx={{ minWidth: '100px' }}>{r.startNAV ? Number(r.startNAV).toFixed(4) : '-'}</TableCell>
                                    <TableCell sx={{ minWidth: '100px' }}>{r.endNAV ? Number(r.endNAV).toFixed(4) : '-'}</TableCell>
                                    <TableCell sx={{ 
                                        minWidth: '120px',
                                        color: !isNaN(simple) ? (simple >= 0 ? 'success.main' : 'error.main') : 'inherit', 
                                        fontWeight: 600
                                    }}>
                                        {!isNaN(simple) ? `${simple.toFixed(2)}%` : '-'}
                                    </TableCell>
                                    <TableCell sx={{ 
                                        minWidth: '140px',
                                        color: !isNaN(annualized) ? (annualized >= 0 ? 'success.main' : 'error.main') : 'inherit', 
                                        fontWeight: 600
                                    }}>
                                        {!isNaN(annualized) ? `${annualized.toFixed(2)}%` : '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}
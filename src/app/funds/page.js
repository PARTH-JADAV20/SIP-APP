"use client";

import React, { useEffect, useState, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import FundCard from '../components/FunCard';
import { 
  Container, 
  Box, 
  useTheme, 
  Pagination, 
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

export default function FundsPage() {
    const [loading, setLoading] = useState(true);
    const [schemes, setSchemes] = useState([]);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [cardsPerPage, setCardsPerPage] = useState(30);
    const theme = useTheme();

    useEffect(() => {
        let mounted = true;
        async function fetchSchemes() {
            setLoading(true);
            try {
                const res = await fetch('/api/mf');
                const data = await res.json();
                if (!mounted) return;
                setSchemes(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchSchemes();
        return () => { mounted = false; };
    }, []);

    // Filter schemes based on search query
    const filteredSchemes = useMemo(() => {
        return schemes.filter(s => 
            s.schemeName.toLowerCase().includes(q.toLowerCase()) ||
            (s.fundHouse && s.fundHouse.toLowerCase().includes(q.toLowerCase())) ||
            (s.schemeCategory && s.schemeCategory.toLowerCase().includes(q.toLowerCase()))
        );
    }, [schemes, q]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredSchemes.length / cardsPerPage);
    const startIndex = (page - 1) * cardsPerPage;
    const currentSchemes = filteredSchemes.slice(startIndex, startIndex + cardsPerPage);

    // Reset to first page when search query changes
    useEffect(() => {
        setPage(1);
    }, [q]);

    // Handle page change with smooth scroll to top
    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Generate pagination numbers with ellipsis
    const getPaginationNumbers = () => {
        const pages = [];
        const totalPageNumbers = 7; // Show max 7 page numbers
        
        if (totalPages <= totalPageNumbers) {
            // Show all pages if total pages are less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            // Calculate start and end of middle pages
            let start = Math.max(2, page - 2);
            let end = Math.min(totalPages - 1, page + 2);
            
            // Adjust if we're at the beginning
            if (page <= 4) {
                end = 5;
            }
            
            // Adjust if we're at the end
            if (page >= totalPages - 3) {
                start = totalPages - 4;
            }
            
            // Add ellipsis after first page if needed
            if (start > 2) {
                pages.push('...');
            }
            
            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            // Add ellipsis before last page if needed
            if (end < totalPages - 1) {
                pages.push('...');
            }
            
            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    // Custom pagination component
    const CustomPagination = () => {
        const pageNumbers = getPaginationNumbers();
        
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    disabled={page === 1}
                    onClick={() => handlePageChange(null, page - 1)}
                    size="small"
                >
                    Previous
                </Button>
                
                {pageNumbers.map((pageNumber, index) => (
                    pageNumber === '...' ? (
                        <Typography key={`ellipsis-${index}`} sx={{ px: 1 }}>
                            ...
                        </Typography>
                    ) : (
                        <Button
                            key={pageNumber}
                            variant={page === pageNumber ? "contained" : "outlined"}
                            onClick={() => handlePageChange(null, pageNumber)}
                            size="small"
                            sx={{ minWidth: '40px' }}
                        >
                            {pageNumber}
                        </Button>
                    )
                ))}
                
                <Button
                    variant="outlined"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(null, page + 1)}
                    size="small"
                >
                    Next
                </Button>
            </Box>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Search and Controls */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField 
                    label="Search schemes" 
                    variant="outlined" 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)}
                    sx={{
                        flexGrow: 1,
                        minWidth: '300px',
                        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default',
                        '& .MuiInputBase-input': {
                            color: theme.palette.text.primary
                        },
                        '& .MuiInputLabel-root': {
                            color: theme.palette.text.secondary
                        }
                    }}
                    placeholder="Search by scheme name, fund house, or category..."
                />
                
                <FormControl sx={{ minWidth: '120px' }}>
                    <InputLabel>Per Page</InputLabel>
                    <Select
                        value={cardsPerPage}
                        label="Per Page"
                        onChange={(e) => {
                            setCardsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        <MenuItem value={15}>15</MenuItem>
                        <MenuItem value={30}>30</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Results Info */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {startIndex + 1}-{Math.min(startIndex + cardsPerPage, filteredSchemes.length)} of {filteredSchemes.length} schemes
                </Typography>
                {q && (
                    <Typography variant="body2" color="primary">
                        Search results for: &quot;{q}&quot;
                    </Typography>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Schemes Grid - Simple CSS Grid */}
                    <Box sx={{ width: '100%' }}>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                            gap: '24px',
                            width: '100%'
                        }}>
                            {currentSchemes.map((s) => (
                                <div key={s.schemeCode} style={{ width: '100%', minHeight: '200px' }}>
                                    <FundCard scheme={s} />
                                </div>
                            ))}
                        </div>
                    </Box>

                    {/* No Results */}
                    {filteredSchemes.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                                No schemes found matching your search
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Try adjusting your search terms
                            </Typography>
                        </Box>
                    )}

                    {/* Pagination */}
                    {filteredSchemes.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <CustomPagination />
                            
                            {/* Quick Page Jump */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Go to page:
                                </Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    value={page}
                                    onChange={(e) => {
                                        const newPage = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                                        setPage(newPage);
                                    }}
                                    inputProps={{ 
                                        min: 1, 
                                        max: totalPages,
                                        style: { 
                                            width: '60px',
                                            textAlign: 'center'
                                        }
                                    }}
                                    sx={{ width: '80px' }}
                                />
                                <Typography variant="body2" color="text.secondary">
                                    of {totalPages}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
}
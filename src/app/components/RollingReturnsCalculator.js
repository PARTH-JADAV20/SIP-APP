'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Button,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
  FormControl,
  InputLabel,
  useTheme,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

function parseDDMMYYYY(dateStr) {
  const [dd, mm, yyyy] = dateStr.split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function formatDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rolling-tabpanel-${index}`}
      aria-labelledby={`rolling-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function RollingReturnsCalculator({ code, navHistory }) {
  const [error, setError] = useState(null);
  const [rollingResults, setRollingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewMode, setViewMode] = useState(0);
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const sortedHistory = [...navHistory].sort(
    (a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date)
  );
  const minDate = sortedHistory[0] ? parseDDMMYYYY(sortedHistory[0].date) : new Date('2015-01-01');
  const maxDate = sortedHistory[sortedHistory.length - 1] ? parseDDMMYYYY(sortedHistory[sortedHistory.length - 1].date) : new Date();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      rollingWindow: '3',
      rollingFrom: minDate,
      rollingTo: maxDate,
    },
  });

  const rollingFrom = watch('rollingFrom');
  const rollingTo = watch('rollingTo');
  const rollingWindow = watch('rollingWindow');

  useEffect(() => {
    if (!isInitialized && navHistory.length > 0) {
      const today = new Date(maxDate);
      let newStart;

      switch (rollingWindow) {
        case '1':
          newStart = new Date(today);
          newStart.setFullYear(today.getFullYear() - 1);
          break;
        case '3':
          newStart = new Date(today);
          newStart.setFullYear(today.getFullYear() - 3);
          break;
        case '5':
          newStart = new Date(today);
          newStart.setFullYear(today.getFullYear() - 5);
          break;
        case '7':
          newStart = new Date(today);
          newStart.setFullYear(today.getFullYear() - 7);
          break;
        case '10':
          newStart = new Date(today);
          newStart.setFullYear(today.getFullYear() - 10);
          break;
        default:
          newStart = new Date(minDate);
      }

      if (newStart < minDate) {
        newStart = new Date(minDate);
      }

      setValue('rollingFrom', newStart);
      setValue('rollingTo', today);
      setIsInitialized(true);
    }
  }, [isInitialized, minDate, maxDate, rollingWindow, setValue, navHistory.length]);

  const handleWindowChange = (windowValue) => {
    setValue('rollingWindow', windowValue);

    const today = new Date(maxDate);
    let newStart;

    switch (windowValue) {
      case '1':
        newStart = new Date(today);
        newStart.setFullYear(today.getFullYear() - 1);
        break;
      case '3':
        newStart = new Date(today);
        newStart.setFullYear(today.getFullYear() - 3);
        break;
      case '5':
        newStart = new Date(today);
        newStart.setFullYear(today.getFullYear() - 5);
        break;
      case '7':
        newStart = new Date(today);
        newStart.setFullYear(today.getFullYear() - 7);
        break;
      case '10':
        newStart = new Date(today);
        newStart.setFullYear(today.getFullYear() - 10);
        break;
      default:
        newStart = new Date(minDate);
    }

    if (newStart < minDate) {
      newStart = new Date(minDate);
    }

    setValue('rollingFrom', newStart);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    try {
      const windowYears = parseInt(data.rollingWindow);
      const startDate = new Date(data.rollingFrom);
      const endDate = new Date(data.rollingTo);

      if (startDate >= endDate) {
        setError('Start date must be before end date');
        setRollingResults([]);
        return;
      }

      const filteredHistory = navHistory
        .filter((h) => {
          const hDate = parseDDMMYYYY(h.date);
          return hDate >= startDate && hDate <= endDate && parseFloat(h.nav) > 0;
        })
        .sort((a, b) => parseDDMMYYYY(a.date) - parseDDMMYYYY(b.date));

      if (filteredHistory.length === 0) {
        setError('No NAV data available for the selected date range');
        setRollingResults([]);
        return;
      }

      const rollingData = [];
      let completePeriods = 0;
      let incompletePeriods = 0;

      for (let i = 0; i < filteredHistory.length; i++) {
        const startNavEntry = filteredHistory[i];
        const startDateObj = parseDDMMYYYY(startNavEntry.date);

        const targetEndDate = new Date(startDateObj);
        targetEndDate.setFullYear(targetEndDate.getFullYear() + windowYears);

        let endNavEntry = null;
        let minDiff = Infinity;

        for (let j = i + 1; j < filteredHistory.length; j++) {
          const currentDate = parseDDMMYYYY(filteredHistory[j].date);
          const diff = Math.abs(currentDate - targetEndDate);

          if (diff < minDiff) {
            minDiff = diff;
            endNavEntry = filteredHistory[j];
          }
        }

        if (!endNavEntry) continue;

        const startNav = parseFloat(startNavEntry.nav);
        const endNav = parseFloat(endNavEntry.nav);
        const endDateObj = parseDDMMYYYY(endNavEntry.date);

        if (startNav === 0 || endNav === 0) continue;

        const days = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24);
        const minRequiredDays = 180;
        if (days < minRequiredDays) continue;

        const annualizedReturn = (Math.pow(endNav / startNav, 365 / days) - 1) * 100;

        const isCompletePeriod = days >= (windowYears * 365 * 0.9);
        if (isCompletePeriod) completePeriods++;
        else incompletePeriods++;

        rollingData.push({
          date: startNavEntry.date,
          return: parseFloat(annualizedReturn.toFixed(2)),
          startNav: startNav,
          endNav: endNav,
          periodDays: Math.round(days),
          isComplete: isCompletePeriod,
          periodYears: (days / 365).toFixed(1)
        });
      }

      if (rollingData.length === 0) {
        setError(`No rolling periods found in the selected date range. Try a shorter period or different dates.`);
        setRollingResults([]);
        return;
      }

      if (incompletePeriods > completePeriods) {
        setError(`Note: ${incompletePeriods} out of ${rollingData.length} periods are shorter than ${windowYears} years. Returns are annualized based on actual holding periods.`);
      } else if (incompletePeriods > 0) {
        setError(`Note: ${incompletePeriods} periods are shorter than ${windowYears} years. Returns are annualized.`);
      }

      setRollingResults(rollingData);
    } catch (err) {
      console.error('Rolling returns calculation error:', err);
      setError('Failed to calculate rolling returns. Please try again.');
      setRollingResults([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = rollingResults.length > 0 ? {
    minReturn: Math.min(...rollingResults.map(r => r.return)),
    maxReturn: Math.max(...rollingResults.map(r => r.return)),
    avgReturn: rollingResults.reduce((sum, r) => sum + r.return, 0) / rollingResults.length,
    positiveReturns: rollingResults.filter(r => r.return > 0).length,
    totalPeriods: rollingResults.length,
    completePeriods: rollingResults.filter(r => r.isComplete).length
  } : null;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          textAlign: 'center',
          color: darkMode ? '#E2E8DD' : '#4E5340'
        }}
      >
        Rolling Returns Calculator
      </Typography>

      {/* Input Section */}
      <Card sx={{
        p: 3,
        borderRadius: 3,
        background: darkMode
          ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
        border: darkMode
          ? '1px solid rgba(78, 83, 64, 0.3)'
          : '1px solid rgba(226, 232, 221, 0.8)',
      }}>
        <CardContent sx={{ p: 0 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: darkMode ? '#95A3A4' : '#697268' }}>Rolling Period</InputLabel>
                    <Select
                      value={rollingWindow}
                      onChange={(e) => handleWindowChange(e.target.value)}
                      label="Rolling Period"
                      sx={{
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      <MenuItem value="1">1 Year</MenuItem>
                      <MenuItem value="3">3 Years</MenuItem>
                      <MenuItem value="5">5 Years</MenuItem>
                      <MenuItem value="7">7 Years</MenuItem>
                      <MenuItem value="10">10 Years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="Analysis Start Date"
                    value={rollingFrom}
                    onChange={(date) => setValue('rollingFrom', date)}
                    minDate={minDate}
                    maxDate={maxDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                        }
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="Analysis End Date"
                    value={rollingTo}
                    onChange={(date) => setValue('rollingTo', date)}
                    minDate={minDate}
                    maxDate={maxDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        sx: {
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                        }
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #4E5340 0%, #697268 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #3a3e30 0%, #565b4d 100%)',
                      }
                    }}
                  >
                    {loading ? 'Calculating...' : 'Calculate'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </LocalizationProvider>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <Card sx={{
          p: 3,
          borderRadius: 3,
          background: darkMode
            ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
          border: darkMode
            ? '1px solid rgba(78, 83, 64, 0.3)'
            : '1px solid rgba(226, 232, 221, 0.8)',
        }}>
          <CardContent sx={{ p: 0 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                  textAlign: 'center',
                  border: darkMode
                    ? '1px solid rgba(78, 83, 64, 0.4)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                    Average Return
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: stats.avgReturn >= 0 ? '#697268' : '#ff4444' }}>
                    {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(2)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                  textAlign: 'center',
                  border: darkMode
                    ? '1px solid rgba(78, 83, 64, 0.4)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                    Periods Analyzed
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#4E5340' }}>
                    {stats.totalPeriods}
                  </Typography>
                  <Typography variant="caption" sx={{ color: darkMode ? '#95A3A4' : '#697268' }}>
                    {stats.completePeriods} complete
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                  textAlign: 'center',
                  border: darkMode
                    ? '1px solid rgba(78, 83, 64, 0.4)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                    Success Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#95A3A4' }}>
                    {((stats.positiveReturns / stats.totalPeriods) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: darkMode ? '#95A3A4' : '#697268' }}>
                    {stats.positiveReturns}/{stats.totalPeriods} positive
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)',
                  textAlign: 'center',
                  border: darkMode
                    ? '1px solid rgba(78, 83, 64, 0.4)'
                    : '1px solid rgba(226, 232, 221, 0.8)',
                }}>
                  <Typography variant="subtitle2" sx={{ color: darkMode ? '#95A3A4' : '#697268', mb: 1 }}>
                    Return Range
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#697268' }}>
                    Best: +{stats.maxReturn.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff4444' }}>
                    Worst: {stats.minReturn.toFixed(2)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {rollingResults.length > 0 && (
        <Card sx={{
          p: 3,
          borderRadius: 3,
          background: darkMode
            ? 'linear-gradient(135deg, #242724 0%, #2a2e2a 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF5 100%)',
          border: darkMode
            ? '1px solid rgba(78, 83, 64, 0.3)'
            : '1px solid rgba(226, 232, 221, 0.8)',
        }}>
          <CardContent sx={{ p: 0 }}>
            {/* View Mode Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)} centered>
                <Tab label="Chart View" />
                <Tab label="Table View" />
              </Tabs>
            </Box>

            <TabPanel value={viewMode} index={0}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: darkMode ? '#E2E8DD' : '#4E5340'
                }}
              >
                {rollingWindow}-Year Rolling Returns
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={rollingResults}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2a2e2a' : '#e0e0e0'} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: darkMode ? '#95A3A4' : '#697268' }}
                    axisLine={{ stroke: darkMode ? '#95A3A4' : '#697268' }}
                    tickFormatter={(value) => {
                      const date = parseDDMMYYYY(value);
                      return `${date.getFullYear()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fill: darkMode ? '#95A3A4' : '#697268' }}
                    axisLine={{ stroke: darkMode ? '#95A3A4' : '#697268' }}
                    label={{
                      value: 'Annualized Return (%)',
                      angle: -90,
                      position: 'insideLeft',
                      style: {
                        textAnchor: 'middle',
                        fill: darkMode ? '#95A3A4' : '#697268'
                      }
                    }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => {
                      if (name === 'return') return [`${value}%`, 'Annualized Return'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        const data = payload[0].payload;
                        const date = parseDDMMYYYY(label);
                        const periodInfo = data.isComplete
                          ? `Complete ${data.periodYears} years`
                          : `Partial ${data.periodYears} years`;
                        return `Start: ${date.toLocaleDateString('en-IN')} (${periodInfo})`;
                      }
                      return `Start: ${parseDDMMYYYY(label).toLocaleDateString('en-IN')}`;
                    }}
                    contentStyle={{
                      backgroundColor: darkMode ? '#2a2e2a' : '#ffffff',
                      border: darkMode ? '1px solid #4E5340' : '1px solid #E2E8DD',
                      borderRadius: '8px',
                      color: darkMode ? '#E2E8DD' : '#4E5340'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="return"
                    stroke={darkMode ? '#B7D1DA' : '#4E5340'}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 6 }}
                    name={`${rollingWindow}-Year Return`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabPanel>

            <TabPanel value={viewMode} index={1}>
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: darkMode ? '#E2E8DD' : '#4E5340'
                }}
              >
                {rollingWindow}-Year Rolling Returns - Detailed Table
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400, backgroundColor: 'transparent' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }}>Start Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }} align="right">Start NAV</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }} align="right">End NAV</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }} align="right">Period</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }} align="right">Annualized Return</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: darkMode ? '#2a2e2a' : '#E2E8DD' }} align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rollingResults.map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: row.return >= 0
                            ? (darkMode ? 'rgba(105, 114, 104, 0.1)' : 'rgba(226, 232, 221, 0.3)')
                            : (darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.08)')
                        }}
                      >
                        <TableCell component="th" scope="row" sx={{ color: darkMode ? '#E2E8DD' : '#4E5340' }}>
                          {parseDDMMYYYY(row.date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell align="right" sx={{ color: darkMode ? '#E2E8DD' : '#4E5340' }}>₹{row.startNav.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: darkMode ? '#E2E8DD' : '#4E5340' }}>₹{row.endNav.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ color: darkMode ? '#E2E8DD' : '#4E5340' }}>{row.periodYears} years</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 'bold',
                            color: row.return >= 0 ? (darkMode ? '#697268' : '#4E5340') : '#ff4444'
                          }}
                        >
                          {row.return >= 0 ? '+' : ''}{row.return}%
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.isComplete ? 'Complete' : 'Partial'}
                            size="small"
                            color={row.isComplete ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: darkMode ? 'rgba(78, 83, 64, 0.2)' : 'rgba(226, 232, 221, 0.6)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: darkMode ? '#95A3A4' : '#697268' }}>
                  Showing {rollingResults.length} rolling periods.
                  {rollingResults.filter(r => r.isComplete).length} complete periods,
                  {' '}{rollingResults.filter(r => !r.isComplete).length} partial periods.
                </Typography>
              </Box>
            </TabPanel>

            <Typography variant="body2" sx={{ mt: 2, color: darkMode ? '#95A3A4' : '#697268', textAlign: 'center' }}>
              {viewMode === 0
                ? `Shows ${rollingWindow}-year annualized returns for each starting date. Each point represents the return if invested on that date and held for ${rollingWindow} years.`
                : `Detailed view of all ${rollingWindow}-year rolling returns. Green rows indicate positive returns, red rows indicate negative returns.`
              }
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
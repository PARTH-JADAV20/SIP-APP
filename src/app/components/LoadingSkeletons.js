// components/LoadingSkeletons.js
import { Box, Skeleton } from '@mui/material';

export function PortfolioListSkeleton() {
  return (
    <Box>
      {[1, 2, 3].map((item) => (
        <Box key={item} mb={3}>
          <Skeleton variant="rectangular" height={150} />
        </Box>
      ))}
    </Box>
  );
}

export function PortfolioDetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={300} sx={{ mb: 3 }} />
      <Box display="flex" gap={3} mb={3}>
        <Skeleton variant="rectangular" height={200} width="100%" />
        <Skeleton variant="rectangular" height={200} width="100%" />
        <Skeleton variant="rectangular" height={200} width="100%" />
      </Box>
    </Box>
  );
}
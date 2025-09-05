import { Box, CircularProgress, Alert, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function LoadingError({ loading, error, onRetry, children }: LoadingErrorProps) {
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 200 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            onRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={onRetry}
                startIcon={<Refresh />}
              >
                Retry
              </Button>
            )
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
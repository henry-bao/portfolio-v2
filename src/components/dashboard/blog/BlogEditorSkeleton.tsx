import { Box, Divider, Grid, Paper, Skeleton, Typography } from '@mui/material';

export function BlogEditorSkeleton() {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                <Skeleton animation="wave" width={300} sx={{ borderRadius: '4px' }} />
            </Typography>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            <Skeleton animation="wave" width={150} sx={{ borderRadius: '4px' }} />
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Skeleton animation="wave" variant="rectangular" height={56} sx={{ borderRadius: '4px' }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Skeleton animation="wave" variant="rectangular" height={56} sx={{ borderRadius: '4px' }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Skeleton animation="wave" variant="rectangular" height={56} sx={{ borderRadius: '4px' }} />
                            </Grid>
                            <Grid item xs={12}>
                                <Skeleton animation="wave" variant="rectangular" height={80} sx={{ borderRadius: '4px' }} />
                            </Grid>
                            <Grid item xs={12}>
                                <Skeleton animation="wave" variant="rectangular" height={40} sx={{ borderRadius: '4px' }} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            <Skeleton animation="wave" width={150} sx={{ borderRadius: '4px' }} />
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Skeleton animation="wave" variant="rectangular" height={200} sx={{ borderRadius: '4px' }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            <Skeleton animation="wave" width={100} sx={{ borderRadius: '4px' }} />
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Skeleton animation="wave" variant="rectangular" height={36} sx={{ mb: 2, borderRadius: '4px' }} />
                        <Skeleton animation="wave" variant="rectangular" height={400} sx={{ borderRadius: '4px' }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Skeleton animation="wave" variant="rectangular" width={100} height={40} sx={{ borderRadius: '4px' }} />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}

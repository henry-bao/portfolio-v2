import { Box } from '@mui/material';

interface ImagePreviewProps {
    src: string;
    alt: string;
    maxHeight: number;
    maxWidth?: number | string;
    centered?: boolean;
    rounded?: boolean;
}

/** Thumbnail of an uploaded or about-to-be-uploaded image in the dashboard forms. */
export function ImagePreview({
    src,
    alt,
    maxHeight,
    maxWidth = '100%',
    centered = false,
    rounded = false,
}: ImagePreviewProps) {
    return (
        <Box
            component="img"
            src={src}
            alt={alt}
            sx={{
                display: 'block',
                maxWidth,
                maxHeight,
                mx: centered ? 'auto' : 0,
                mb: '10px',
                borderRadius: rounded ? 1 : 0,
            }}
        />
    );
}

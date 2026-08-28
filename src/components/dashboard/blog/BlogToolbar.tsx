import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import {
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatListBulleted as FormatListBulletedIcon,
    FormatListNumbered as FormatListNumberedIcon,
    Image as ImageIcon,
    Link as LinkIcon,
    Code as CodeIcon,
    FormatQuote as FormatQuoteIcon,
    HorizontalRule as HorizontalRuleIcon,
    FormatSize as HeadingIcon,
    PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material';
import type { MarkdownFormatAction } from '../../../hooks';

interface BlogToolbarProps {
    onFormatText: (type: MarkdownFormatAction) => void;
    onInsertImage: () => void;
    onOpenMediaLibrary?: () => void;
}

export function BlogToolbar({ onFormatText, onInsertImage, onOpenMediaLibrary }: BlogToolbarProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
            }}
        >
            <Tooltip title="Heading">
                <IconButton onClick={() => onFormatText('heading')} size="small">
                    <HeadingIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Bold">
                <IconButton onClick={() => onFormatText('bold')} size="small">
                    <FormatBoldIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Italic">
                <IconButton onClick={() => onFormatText('italic')} size="small">
                    <FormatItalicIcon />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Bullet List">
                <IconButton onClick={() => onFormatText('bulletList')} size="small">
                    <FormatListBulletedIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Numbered List">
                <IconButton onClick={() => onFormatText('numberedList')} size="small">
                    <FormatListNumberedIcon />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Quote">
                <IconButton onClick={() => onFormatText('quote')} size="small">
                    <FormatQuoteIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Code">
                <IconButton onClick={() => onFormatText('code')} size="small">
                    <CodeIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Link">
                <IconButton onClick={() => onFormatText('link')} size="small">
                    <LinkIcon />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />

            <Tooltip title="Image">
                <IconButton onClick={onInsertImage} size="small">
                    <ImageIcon />
                </IconButton>
            </Tooltip>

            {onOpenMediaLibrary && (
                <Tooltip title="Media Library">
                    <IconButton onClick={onOpenMediaLibrary} size="small">
                        <PhotoLibraryIcon />
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title="Horizontal Rule">
                <IconButton onClick={() => onFormatText('hr')} size="small">
                    <HorizontalRuleIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

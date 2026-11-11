import type { Ref } from 'react';
import { Box, FormHelperText, Tab, Tabs, TextField, Typography } from '@mui/material';
import type { MarkdownFormatAction } from '../../../hooks';
import { MarkdownContent } from '../../shared/MarkdownContent';
import { BlogToolbar } from './BlogToolbar';

export type EditorTab = 'write' | 'preview';

interface BlogContentEditorProps {
    content: string;
    error?: string;
    tab: EditorTab;
    inputRef: Ref<HTMLTextAreaElement>;
    onContentChange: (value: string) => void;
    onTabChange: (tab: EditorTab) => void;
    onFormatText: (action: MarkdownFormatAction) => void;
    onTrackSelection: () => void;
    onInsertImage: () => void;
    onOpenMediaLibrary: () => void;
}

export function BlogContentEditor({
    content,
    error,
    tab,
    inputRef,
    onContentChange,
    onTabChange,
    onFormatText,
    onTrackSelection,
    onInsertImage,
    onOpenMediaLibrary,
}: BlogContentEditorProps) {
    return (
        <Box>
            <Tabs value={tab} onChange={(_event, value: EditorTab) => onTabChange(value)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Write" value="write" />
                <Tab label="Preview" value="preview" />
            </Tabs>

            {tab === 'write' ? (
                <Box>
                    <BlogToolbar onFormatText={onFormatText} onInsertImage={onInsertImage} onOpenMediaLibrary={onOpenMediaLibrary} />
                    <TextField
                        fullWidth
                        multiline
                        minRows={20}
                        value={content}
                        onChange={(event) => onContentChange(event.target.value)}
                        onMouseUp={onTrackSelection}
                        onKeyUp={onTrackSelection}
                        onClick={onTrackSelection}
                        inputRef={inputRef}
                        placeholder="Write your blog post content here using Markdown..."
                        variant="outlined"
                        error={Boolean(error)}
                        sx={{
                            '& .MuiOutlinedInput-root fieldset': { border: error ? undefined : 'none' },
                            '& .MuiInputBase-input': {
                                fontFamily: 'Monaco, "Lucida Console", monospace',
                                fontSize: '14px',
                                lineHeight: '1.5',
                            },
                        }}
                    />
                </Box>
            ) : (
                <Box sx={{ p: 3, minHeight: '400px', border: 1, borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                    {content.trim() ? (
                        <MarkdownContent>{content}</MarkdownContent>
                    ) : (
                        <Typography color="textSecondary" align="center" sx={{ py: 10 }}>
                            No content to preview
                        </Typography>
                    )}
                </Box>
            )}

            {error && <FormHelperText error>{error}</FormHelperText>}
        </Box>
    );
}

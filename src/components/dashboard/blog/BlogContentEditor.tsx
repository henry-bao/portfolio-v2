import { Box, Tab, Tabs, TextField } from '@mui/material';
import { BlogToolbar } from './BlogToolbar';
import type { MarkdownFormatAction } from '../../../hooks/useMarkdownEditor';

interface BlogContentEditorProps {
    content: string;
    editorTab: number;
    onContentChange: (value: string) => void;
    onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    onFormatText: (type: MarkdownFormatAction) => void;
    onInsertImage: () => void;
    onOpenMediaLibrary?: () => void;
    renderMarkdownPreview: () => React.ReactNode;
    inputRef?: React.Ref<HTMLTextAreaElement>;
    onTrackSelection?: () => void;
}

export function BlogContentEditor({
    content,
    editorTab,
    onContentChange,
    onTabChange,
    onFormatText,
    onInsertImage,
    onOpenMediaLibrary,
    renderMarkdownPreview,
    inputRef,
    onTrackSelection,
}: BlogContentEditorProps) {
    return (
        <Box>
            <Tabs value={editorTab} onChange={onTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Write" />
                <Tab label="Preview" />
            </Tabs>

            {editorTab === 0 ? (
                <Box>
                    <BlogToolbar
                        onFormatText={onFormatText}
                        onInsertImage={onInsertImage}
                        onOpenMediaLibrary={onOpenMediaLibrary}
                    />
                    <TextField
                        fullWidth
                        multiline
                        minRows={20}
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
                        onMouseUp={onTrackSelection}
                        onKeyUp={onTrackSelection}
                        onClick={onTrackSelection}
                        inputRef={inputRef}
                        placeholder="Write your blog post content here using Markdown..."
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    border: 'none',
                                },
                            },
                            '& .MuiInputBase-input': {
                                fontFamily: 'Monaco, "Lucida Console", monospace',
                                fontSize: '14px',
                                lineHeight: '1.5',
                            },
                        }}
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        p: 3,
                        minHeight: '400px',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mt: 1,
                    }}
                >
                    {renderMarkdownPreview()}
                </Box>
            )}
        </Box>
    );
}

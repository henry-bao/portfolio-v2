import { Box, Tab, Tabs, TextField } from '@mui/material';
import { BlogToolbar } from './BlogToolbar';

interface BlogContentEditorProps {
    content: string;
    editorTab: number;
    onContentChange: (value: string) => void;
    onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    onFormatText: (type: string, wrapper?: string) => void;
    onInsertImage: () => void;
    renderMarkdownPreview: () => React.ReactNode;
}

export function BlogContentEditor({
    content,
    editorTab,
    onContentChange,
    onTabChange,
    onFormatText,
    onInsertImage,
    renderMarkdownPreview
}: BlogContentEditorProps) {
    return (
        <Box>
            <Tabs value={editorTab} onChange={onTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Write" />
                <Tab label="Preview" />
            </Tabs>

            {editorTab === 0 ? (
                <Box>
                    <BlogToolbar onFormatText={onFormatText} onInsertImage={onInsertImage} />
                    <TextField
                        fullWidth
                        multiline
                        minRows={20}
                        value={content}
                        onChange={(e) => onContentChange(e.target.value)}
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
                <Box sx={{ 
                    p: 3, 
                    minHeight: '400px', 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mt: 1
                }}>
                    {renderMarkdownPreview()}
                </Box>
            )}
        </Box>
    );
}
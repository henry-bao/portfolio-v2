import { ChangeEvent } from 'react';
import {
    Grid,
    TextField,
    InputAdornment,
    Button,
    FormControlLabel,
    Switch,
    Typography,
    Divider,
    Chip,
    Box
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface BlogMetadataProps {
    title: string;
    slug: string;
    summary: string;
    publishedDate: string;
    published: boolean;
    tags: string[];
    tagInput: string;
    onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSlugChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSummaryChange: (value: string) => void;
    onPublishedDateChange: (value: string) => void;
    onPublishedChange: (checked: boolean) => void;
    onTagInputChange: (value: string) => void;
    onManualSlugGenerate: () => void;
    onTagAdd: () => void;
    onTagRemove: (tagToRemove: string) => void;
}

export function BlogMetadata({
    title,
    slug,
    summary,
    publishedDate,
    published,
    tags,
    tagInput,
    onTitleChange,
    onSlugChange,
    onSummaryChange,
    onPublishedDateChange,
    onPublishedChange,
    onTagInputChange,
    onManualSlugGenerate,
    onTagAdd,
    onTagRemove
}: BlogMetadataProps) {
    return (
        <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
                Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Title"
                        value={title}
                        onChange={onTitleChange}
                        margin="normal"
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Slug"
                        value={slug}
                        onChange={onSlugChange}
                        margin="normal"
                        required
                        helperText="Used for the URL"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button size="small" onClick={onManualSlugGenerate}>
                                        Generate
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Published Date"
                        type="date"
                        value={publishedDate}
                        onChange={(e) => onPublishedDateChange(e.target.value)}
                        margin="normal"
                        required
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Summary"
                        value={summary}
                        onChange={(e) => onSummaryChange(e.target.value)}
                        margin="normal"
                        required
                        multiline
                        minRows={2}
                        maxRows={4}
                        helperText="A brief description for blog preview cards"
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Switch 
                                checked={published} 
                                onChange={(e) => onPublishedChange(e.target.checked)} 
                            />
                        }
                        label="Publish this post"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Add Tag"
                        value={tagInput}
                        onChange={(e) => onTagInputChange(e.target.value)}
                        margin="normal"
                        placeholder="Enter tag and press Enter"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onTagAdd();
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button
                                        size="small"
                                        onClick={onTagAdd}
                                        startIcon={<AddIcon />}
                                        disabled={!tagInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    {tags.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {tags.map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={tag}
                                    onDelete={() => onTagRemove(tag)}
                                    size="small"
                                />
                            ))}
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
}
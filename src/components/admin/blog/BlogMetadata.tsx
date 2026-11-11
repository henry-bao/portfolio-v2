import { useState } from 'react';
import { Box, Button, Chip, Divider, FormControlLabel, Grid, InputAdornment, Switch, TextField, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { MAX_TAG_LENGTH, MAX_TAGS, addTag } from './blogForm';
import type { BlogFormValues } from './blogForm';

interface BlogMetadataProps {
    values: BlogFormValues;
    errors: Record<string, string>;
    onChange: (changes: Partial<BlogFormValues>) => void;
    onTitleChange: (title: string) => void;
    onSlugChange: (slug: string) => void;
    onGenerateSlug: () => void;
}

export function BlogMetadata({ values, errors, onChange, onTitleChange, onSlugChange, onGenerateSlug }: BlogMetadataProps) {
    return (
        <Grid size={12}>
            <Typography variant="h6" gutterBottom>
                Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
                <Grid size={12}>
                    <TextField
                        fullWidth
                        label="Title"
                        value={values.title}
                        onChange={(event) => onTitleChange(event.target.value)}
                        margin="normal"
                        required
                        error={Boolean(errors.title)}
                        helperText={errors.title}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        label="Slug"
                        value={values.slug}
                        onChange={(event) => onSlugChange(event.target.value)}
                        margin="normal"
                        required
                        error={Boolean(errors.slug)}
                        helperText={errors.slug ?? 'The post URL: lowercase letters, numbers and dashes'}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Button size="small" onClick={onGenerateSlug} disabled={!values.title.trim()}>
                                            Generate
                                        </Button>
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        fullWidth
                        label="Published Date"
                        type="date"
                        value={values.publishedDate}
                        onChange={(event) => onChange({ publishedDate: event.target.value })}
                        margin="normal"
                        required
                        error={Boolean(errors.publishedDate)}
                        helperText={errors.publishedDate}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>

                <Grid size={12}>
                    <TextField
                        fullWidth
                        label="Summary"
                        value={values.summary}
                        onChange={(event) => onChange({ summary: event.target.value })}
                        margin="normal"
                        required
                        multiline
                        minRows={2}
                        maxRows={4}
                        error={Boolean(errors.summary)}
                        helperText={errors.summary ?? 'A brief description for blog preview cards'}
                    />
                </Grid>

                <Grid size={12}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={values.published}
                                onChange={(event) => onChange({ published: event.target.checked })}
                            />
                        }
                        label="Publish this post"
                    />
                </Grid>

                <Grid size={12}>
                    <TagsField tags={values.tags} error={errors.tags} onChange={(tags) => onChange({ tags })} />
                </Grid>
            </Grid>
        </Grid>
    );
}

function TagsField({ tags, error, onChange }: { tags: string[]; error?: string; onChange: (tags: string[]) => void }) {
    const [input, setInput] = useState('');
    const isFull = tags.length >= MAX_TAGS;

    const handleAdd = () => {
        onChange(addTag(tags, input));
        setInput('');
    };

    return (
        <>
            <TextField
                fullWidth
                label="Add Tag"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                margin="normal"
                placeholder="Enter a tag and press Enter"
                disabled={isFull}
                error={Boolean(error)}
                helperText={error ?? (isFull ? `Posts can have up to ${MAX_TAGS} tags` : undefined)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAdd();
                    }
                }}
                slotProps={{
                    htmlInput: { maxLength: MAX_TAG_LENGTH },
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <Button size="small" onClick={handleAdd} startIcon={<AddIcon />} disabled={!input.trim() || isFull}>
                                    Add
                                </Button>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag) => (
                        <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            onDelete={() => onChange(tags.filter((existing) => existing !== tag))}
                        />
                    ))}
                </Box>
            )}
        </>
    );
}

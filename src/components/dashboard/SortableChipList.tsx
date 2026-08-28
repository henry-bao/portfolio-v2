import { useState } from 'react';
import { Box, Button, Chip, Skeleton, TextField } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import type { SxProps, Theme } from '@mui/material/styles';

const CHIP_HEIGHT = '32px';
const DRAG_ACTIVATION_DISTANCE_PX = 5;

const ListChip = ({ label, onDelete, sx }: { label: string; onDelete?: () => void; sx?: SxProps<Theme> }) => (
    <Chip
        label={label}
        onDelete={onDelete}
        color="primary"
        variant="outlined"
        sx={{ height: CHIP_HEIGHT, margin: 0, color: 'white', ...sx }}
    />
);

const SortableChip = ({
    id,
    label,
    isDraggedOver,
    onDelete,
}: {
    id: string;
    label: string;
    isDraggedOver: boolean;
    onDelete: () => void;
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                opacity: isDragging ? 0 : 1,
                margin: '4px 8px 4px 0',
                display: 'inline-block',
                touchAction: 'none',
                position: 'relative',
                borderRadius: '16px',
                cursor: 'grab',
            }}
            {...attributes}
            {...listeners}
        >
            <ListChip
                label={label}
                onDelete={onDelete}
                sx={{
                    backgroundColor: isDraggedOver ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '& .MuiChip-label': { display: 'block', whiteSpace: 'nowrap' },
                }}
            />
        </div>
    );
};

interface SortableChipListProps {
    /** Namespaces the drag ids so several lists can coexist on one page. */
    idPrefix: string;
    items: string[];
    inputLabel: string;
    inputValue: string;
    isLoading: boolean;
    onInputChange: (value: string) => void;
    onAdd: () => void;
    onItemsChange: (items: string[]) => void;
}

/** Reorderable list of short text values (pronouns, education, languages). */
export function SortableChipList({
    idPrefix,
    items,
    inputLabel,
    inputValue,
    isLoading,
    onInputChange,
    onAdd,
    onItemsChange,
}: SortableChipListProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Positional ids stay unique even when two entries share the same text.
    const itemIds = items.map((_, index) => `${idPrefix}-${index}`);

    const resetDragState = () => {
        setActiveIndex(null);
        setOverId(null);
    };

    const handleDragStart = ({ active }: DragStartEvent) => setActiveIndex(itemIds.indexOf(String(active.id)));

    const handleDragOver = ({ over }: DragOverEvent) => setOverId(over ? String(over.id) : null);

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        resetDragState();

        if (!over || active.id === over.id) {
            return;
        }

        onItemsChange(arrayMove(items, itemIds.indexOf(String(active.id)), itemIds.indexOf(String(over.id))));
    };

    if (isLoading) {
        return (
            <>
                <Skeleton animation="wave" height={56} width="100%" sx={{ mb: 2 }} />
                <Box display="flex" flexWrap="wrap" width="100%" mb={2} gap={1}>
                    <Skeleton animation="wave" height={32} width={100} />
                    <Skeleton animation="wave" height={32} width={120} />
                    <Skeleton animation="wave" height={32} width={80} />
                </Box>
            </>
        );
    }

    return (
        <>
            <Box display="flex" alignItems="center" mb={2}>
                <TextField
                    fullWidth
                    label={inputLabel}
                    value={inputValue}
                    onChange={(event) => onInputChange(event.target.value)}
                    margin="normal"
                />
                <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ ml: 2, mt: 1 }}>
                    Add
                </Button>
            </Box>

            <Box display="flex" flexWrap="wrap" width="100%" mb={2}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={resetDragState}
                >
                    <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                        <Box display="flex" flexWrap="wrap" width="100%" sx={{ minHeight: '50px', position: 'relative' }}>
                            {items.map((item, index) => (
                                <SortableChip
                                    key={itemIds[index]}
                                    id={itemIds[index]}
                                    label={item}
                                    isDraggedOver={overId === itemIds[index]}
                                    onDelete={() => onItemsChange(items.filter((_, i) => i !== index))}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                    <DragOverlay dropAnimation={null} zIndex={1000}>
                        {activeIndex !== null && items[activeIndex] ? <ListChip label={items[activeIndex]} /> : null}
                    </DragOverlay>
                </DndContext>
            </Box>
        </>
    );
}

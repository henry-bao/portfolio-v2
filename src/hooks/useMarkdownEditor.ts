import { useCallback, useRef, useState } from 'react';

export type MarkdownFormatAction = 'bold' | 'italic' | 'heading' | 'bulletList' | 'numberedList' | 'link' | 'code' | 'quote' | 'hr';

interface CursorPosition {
    start: number;
    end: number;
}

export function useMarkdownEditor(content: string, setContent: (value: string) => void) {
    const textFieldRef = useRef<HTMLTextAreaElement | null>(null);
    const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ start: 0, end: 0 });

    const trackSelectionChange = useCallback(() => {
        if (!textFieldRef.current) {
            return;
        }

        setCursorPosition({
            start: textFieldRef.current.selectionStart,
            end: textFieldRef.current.selectionEnd,
        });
    }, []);

    const insertTextAtCursor = useCallback(
        (textToInsert: string) => {
            const textField = textFieldRef.current;

            if (!textField) {
                return;
            }

            const newContent =
                content.substring(0, cursorPosition.start) + textToInsert + content.substring(cursorPosition.end);

            setContent(newContent);

            window.setTimeout(() => {
                textField.focus();
                const newPosition = cursorPosition.start + textToInsert.length;
                textField.setSelectionRange(newPosition, newPosition);
            }, 0);
        },
        [content, cursorPosition.end, cursorPosition.start, setContent]
    );

    const getSelectedText = useCallback(
        () => content.substring(cursorPosition.start, cursorPosition.end),
        [content, cursorPosition.end, cursorPosition.start]
    );

    const applyHeadingFormat = useCallback(() => {
        const textBeforeCursor = content.substring(0, cursorPosition.start);
        const textAfterCursor = content.substring(cursorPosition.end);
        const currentLineStartIndex = textBeforeCursor.lastIndexOf('\n') + 1;
        const currentLine = textBeforeCursor.substring(currentLineStartIndex);
        const headingLevel = currentLine.match(/^(#{1,6})\s/);

        const formattedLine = headingLevel
            ? headingLevel[1].length < 6
                ? `${'#'.repeat(headingLevel[1].length + 1)} ${currentLine.substring(headingLevel[1].length + 1)}`
                : currentLine.substring(headingLevel[1].length + 1)
            : `# ${currentLine}`;

        setContent(textBeforeCursor.substring(0, currentLineStartIndex) + formattedLine + textAfterCursor);
    }, [content, cursorPosition.end, cursorPosition.start, setContent]);

    const applyListFormat = useCallback(
        (ordered: boolean) => {
            const selectedText = getSelectedText();

            if (!selectedText) {
                insertTextAtCursor(ordered ? '1. List item' : '- List item');
                return;
            }

            const replacement = selectedText
                .split('\n')
                .map((line, index) => {
                    if (line.trim() === '') {
                        return '';
                    }

                    return ordered ? `${index + 1}. ${line}` : `- ${line}`;
                })
                .join('\n');

            insertTextAtCursor(replacement);
        },
        [getSelectedText, insertTextAtCursor]
    );

    const applyCodeFormat = useCallback(() => {
        const selectedText = getSelectedText();

        if (selectedText && selectedText.includes('\n')) {
            insertTextAtCursor(`\`\`\`\n${selectedText}\n\`\`\``);
            return;
        }

        insertTextAtCursor(selectedText ? `\`${selectedText}\`` : '`code`');
    }, [getSelectedText, insertTextAtCursor]);

    const applyQuoteFormat = useCallback(() => {
        const selectedText = getSelectedText();

        if (!selectedText) {
            insertTextAtCursor('> Quoted text');
            return;
        }

        insertTextAtCursor(
            selectedText
                .split('\n')
                .map((line) => (line.trim() === '' ? '' : `> ${line}`))
                .join('\n')
        );
    }, [getSelectedText, insertTextAtCursor]);

    const formatMarkdown = useCallback(
        (action: MarkdownFormatAction) => {
            const selectedText = getSelectedText();

            switch (action) {
                case 'bold':
                    insertTextAtCursor(selectedText ? `**${selectedText}**` : '**bold text**');
                    break;
                case 'italic':
                    insertTextAtCursor(selectedText ? `*${selectedText}*` : '*italic text*');
                    break;
                case 'heading':
                    applyHeadingFormat();
                    break;
                case 'bulletList':
                    applyListFormat(false);
                    break;
                case 'numberedList':
                    applyListFormat(true);
                    break;
                case 'link':
                    insertTextAtCursor(selectedText ? `[${selectedText}](url)` : '[link text](url)');
                    break;
                case 'code':
                    applyCodeFormat();
                    break;
                case 'quote':
                    applyQuoteFormat();
                    break;
                case 'hr':
                    insertTextAtCursor('\n\n---\n\n');
                    break;
            }
        },
        [
            applyCodeFormat,
            applyHeadingFormat,
            applyListFormat,
            applyQuoteFormat,
            getSelectedText,
            insertTextAtCursor,
        ]
    );

    return {
        formatMarkdown,
        insertTextAtCursor,
        textFieldRef,
        trackSelectionChange,
    };
}

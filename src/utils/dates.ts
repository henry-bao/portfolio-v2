const blogDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});

const shortDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const localDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export const formatBlogDate = (date: string) => blogDateFormatter.format(new Date(date));

export const formatShortDateTime = (date: string) => shortDateTimeFormatter.format(new Date(date));

export const formatLocalDateTime = (date: string) => localDateTimeFormatter.format(new Date(date));

export const getTodayInputDate = () => new Date().toISOString().slice(0, 10);

export const toInputDate = (date: string) => date.split('T')[0];

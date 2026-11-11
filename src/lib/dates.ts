const blogDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    // Posts store a calendar date as UTC midnight; formatting in UTC keeps it from shifting a day.
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

/** Formats `date`, or returns `''` when it isn't a valid date, instead of throwing a RangeError. */
const safeFormat = (formatter: Intl.DateTimeFormat, date: string | null | undefined) => {
    const parsed = date ? new Date(date) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? formatter.format(parsed) : '';
};

export const formatBlogDate = (date: string | null | undefined) => safeFormat(blogDateFormatter, date);

export const formatShortDateTime = (date: string | null | undefined) => safeFormat(shortDateTimeFormatter, date);

export const formatLocalDateTime = (date: string | null | undefined) => safeFormat(localDateTimeFormatter, date);

/** Today as `YYYY-MM-DD` in the user's time zone, for `<input type="date">`. */
export const getTodayInputDate = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

/** The `YYYY-MM-DD` part of a stored ISO date, for `<input type="date">`. */
export const toInputDate = (date: string | null | undefined) => (date && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : '');

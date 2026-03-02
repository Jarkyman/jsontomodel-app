import Papa from 'papaparse';

export const parseCsvToJson = (csvText: string): any[] | null => {
    try {
        const result = Papa.parse(csvText.trim(), {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically converts numbers and booleans
            transformHeader: (header) => header.trim(),
            transform: (value) => (typeof value === 'string' ? value.trim() : value),
        });

        if (result.errors.length > 0) {
            console.warn('CSV parsing errors:', result.errors);
            // We could throw here, but for our use case, we might still want to return whatever was successfully parsed
            // Or we can return null to signify failure if the first row failed
        }

        if (result.data && result.data.length > 0) {
            return result.data;
        }

        return null;
    } catch (error) {
        console.error('Failed to parse CSV:', error);
        return null;
    }
};

export const isLikelyCsv = (text: string): boolean => {
    const t = text.trim();
    // Very rough heuristic: contains common delimiter, newlines, and does not start with { or [
    if (t.startsWith('{') || t.startsWith('[')) return false;
    const hasDelimiter = t.includes(',') || t.includes(';') || t.includes('\t');
    return hasDelimiter && t.includes('\n');
};

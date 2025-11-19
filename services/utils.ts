

/**
 * Safely parses a value into a number. Returns 0 if the value is not a valid number.
 * Handles strings with commas and currency symbols (e.g. "$1,200.50").
 * Also handles common "empty" indicators from CSV exports like "-", "N/A", "null".
 * @param val The value to parse.
 * @returns A valid number.
 */
export const parseNumeric = (val: any): number => {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined || val === '') return 0;
    
    const strVal = String(val).trim();

    // Handle common CSV placeholders for zero or null
    if (['-', 'n/a', 'null', 'undefined', 'nan'].includes(strVal.toLowerCase())) {
        return 0;
    }

    // Convert to string, remove currency symbols ($), commas, and whitespace
    const cleanStr = strVal.replace(/[$,\s]/g, '');
    const num = Number(cleanStr);
    
    return isNaN(num) ? 0 : num;
};
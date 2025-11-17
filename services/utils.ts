/**
 * Safely parses a value into a number. Returns 0 if the value is not a valid number.
 * @param val The value to parse.
 * @returns A valid number.
 */
export const parseNumeric = (val: any): number => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

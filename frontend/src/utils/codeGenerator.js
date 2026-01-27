/**
 * Genera un código único alfanumérico con un prefijo dado.
 * @param {string} prefix - El prefijo para el código (ej. 'ACT-', 'MNT-').
 * @returns {string} - El código generado.
 */
export const generateCode = (prefix) => {
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${randomStr}`;
};

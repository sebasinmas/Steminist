export const getNextDayDate = (dayName: string): Date => {
    const dayMap: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6,
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
    };

    const normalizedDay = dayName.toLowerCase();
    // Return current date if invalid day name
    if (!(normalizedDay in dayMap)) return new Date();

    const targetDay = dayMap[normalizedDay];
    const today = new Date();
    const currentDay = today.getDay();

    // Calculate days until target day (0-6)
    // If target is today, it returns 0. If we always want next week for today, we'd add logic, 
    // but 0 (today) is generally acceptable for "upcoming availability".
    let daysUntil = (targetDay - currentDay + 7) % 7;

    // Create new date object
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate;
};

export const getDateObject = (dateStr: string): Date => {
    // FIX: Si viene como YYYY-MM-DD, parsear como fecha local (evita corrimiento por timezone)
    const isIsoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

    if (isIsoDateOnly) {
        const [y, m, d] = dateStr.split('-').map(Number);
        // month - 1 porque Date usa 0-11
        return new Date(y, m - 1, d);
    }

    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;

    return getNextDayDate(dateStr);
};

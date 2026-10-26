/** "Nimal Perera" -> "NP". One word gives one letter; a blank or missing name gives "?". */
export const initials = (name?: string | null) =>
    (name ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('') || '?';

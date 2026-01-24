export type GetInitialsFn = (fullName: string) => string;

function getFirstGrapheme(str: string): string {
    const chars = [...str];
    if (chars.length === 0) return '';

    const first = chars[0];
    if (!first) return '';

    const codePoint = first.codePointAt(0);
    if (codePoint === undefined) return first;

    if (
        (codePoint >= 0x1f600 && codePoint <= 0x1f64f) ||
        (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) ||
        (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
        (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff) ||
        (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
        (codePoint >= 0x2700 && codePoint <= 0x27bf) ||
        (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
        (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
        (codePoint >= 0x1fa00 && codePoint <= 0x1fa6f) ||
        (codePoint >= 0x1fa70 && codePoint <= 0x1faff)
    ) {
        return chars[1] ?? '';
    }

    return first;
}

export function getInitials(fullName: string): string {
    const names = fullName
        .trim()
        .split(/\s+/)
        .filter((n) => n.length > 0);

    if (names.length === 0) return '';

    const firstInitial = getFirstGrapheme(names[0]!);
    if (names.length === 1) return firstInitial.toUpperCase();

    const lastInitial = getFirstGrapheme(names[names.length - 1]!);

    return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function useInitials(): GetInitialsFn {
    return getInitials;
}

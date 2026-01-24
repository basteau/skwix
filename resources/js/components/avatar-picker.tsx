const AVAILABLE_AVATARS = [
    'player09',
    'player07',
    'player06',
    'player08',
    'player05',
    'player04',
    'player01',
    'player02',
    'player03',
] as const;

export type AvatarName = (typeof AVAILABLE_AVATARS)[number] | '';

export function getAvatarUrl(avatar: string | null | undefined): string | undefined {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `/images/faces/${avatar}.png`;
}

export function getAvatarForName(name: string): AvatarName {
    const normalized = name.toLowerCase().trim();
    const avatar = AVAILABLE_AVATARS.find((a) => a === normalized);
    return avatar ?? '';
}

export function getPortraitUrl(avatarUrl: string | null | undefined): string | undefined {
    if (!avatarUrl) return undefined;
    const match = avatarUrl.match(/\/images\/faces\/([^/.]+)\.png$/);
    if (!match) return undefined;
    const avatarName = match[1];
    if (!AVAILABLE_AVATARS.includes(avatarName as (typeof AVAILABLE_AVATARS)[number])) {
        return undefined;
    }
    return `/images/portraits/${avatarName}.png`;
}

export { AVAILABLE_AVATARS };

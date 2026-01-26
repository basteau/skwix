const AVAILABLE_AVATARS = [
    'player09',
    'player07',
    'player06',
    'jane',
    'player08',
    'john',
    'player05',
    'player04',
    'player01',
    'player02',
    'player03',
] as const;

export type AvatarName = (typeof AVAILABLE_AVATARS)[number] | '';

export function getAvatarUrl(
    avatar: string | null | undefined,
): string | undefined {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/')) return avatar;
    const name = avatar.endsWith('.png') ? avatar.slice(0, -4) : avatar;
    return `/images/faces/${name}.png`;
}

export function getAvatarForName(name: string): AvatarName {
    const normalized = name.toLowerCase().trim();
    const avatar = AVAILABLE_AVATARS.find((a) => a === normalized);
    return avatar ?? '';
}

export function getPortraitUrl(
    avatar: string | null | undefined,
): string | undefined {
    if (!avatar) return undefined;

    let avatarName: string;

    if (avatar.startsWith('/images/faces/')) {
        const match = avatar.match(/\/images\/faces\/([^/.]+)\.png$/);
        if (!match) return undefined;
        avatarName = match[1];
    } else if (avatar.startsWith('http') || avatar.startsWith('/')) {
        return undefined;
    } else {
        avatarName = avatar;
    }

    if (
        !AVAILABLE_AVATARS.includes(
            avatarName as (typeof AVAILABLE_AVATARS)[number],
        )
    ) {
        return undefined;
    }
    return `/images/portraits/${avatarName}.png`;
}

export { AVAILABLE_AVATARS };

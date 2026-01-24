import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient
                    id="logoGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop
                        offset="100%"
                        stopColor="var(--color-primary-hover)"
                    />
                </linearGradient>
                <linearGradient
                    id="accentGradient"
                    x1="0%"
                    y1="100%"
                    x2="100%"
                    y2="0%"
                >
                    <stop offset="0%" stopColor="var(--color-secondary)" />
                    <stop
                        offset="100%"
                        stopColor="var(--color-primary-light)"
                    />
                </linearGradient>
            </defs>
            <rect
                width="32"
                height="32"
                rx="6"
                fill="var(--color-background)"
            />
            <path
                d="M22.5 10.5C22.5 10.5 21.2 8 16.5 8C11.8 8 9.5 10.8 9.5 13.2C9.5 15.6 11 17 13.5 18L18.5 20C20.5 20.8 21.5 21.5 21.5 23C21.5 24.5 20 25.5 17 25.5C13.5 25.5 11 23.5 11 23.5"
                stroke="url(#logoGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle
                cx="23"
                cy="9"
                r="1.5"
                fill="url(#accentGradient)"
                opacity="0.8"
            />
            <circle
                cx="10"
                cy="24"
                r="1"
                fill="url(#accentGradient)"
                opacity="0.6"
            />
            <path
                d="M8 8L9 9M24 23L25 24M7 13L8 13.5M25 19L24 19.5"
                stroke="url(#accentGradient)"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.5"
            />
        </svg>
    );
}

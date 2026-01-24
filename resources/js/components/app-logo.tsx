import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-2 grid flex-1 text-left">
                <span className="truncate font-display text-sm font-semibold tracking-tight">
                    Skwix
                </span>
            </div>
        </>
    );
}

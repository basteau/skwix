<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Je bent uitgenodigd voor Skwix!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f7ff;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 480px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(51, 124, 191, 0.1);">
                    <!-- Header with snowflakes -->
                    <tr>
                        <td style="padding: 40px 32px 24px; text-align: center; background: linear-gradient(180deg, #e8f4ff 0%, #ffffff 100%); border-radius: 16px 16px 0 0;">
                            <div style="font-size: 48px; margin-bottom: 16px;">❄️</div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a365d; letter-spacing: -0.5px;">
                                Je bent uitgenodigd!
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
                                Hallo <strong style="color: #1a365d;">{{ $playerName }}</strong>,
                            </p>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #334155;">
                                Je bent uitgenodigd om mee te doen aan <strong style="color: #337cbf;">Skwix</strong> – een spannend woordspel waar je elke dag puzzels oplost, vragen stelt en het rad van fortuin draait om punten te verdienen!
                            </p>

                            @if($startsAt)
                            <div style="margin: 24px 0; padding: 16px; background-color: #f0f7ff; border-radius: 10px; border-left: 4px solid #337cbf;">
                                <p style="margin: 0; font-size: 14px; color: #64748b;">
                                    🗓️ Het spel start op:
                                </p>
                                <p style="margin: 4px 0 0; font-size: 18px; font-weight: 600; color: #1a365d;">
                                    {{ $startsAt }}
                                </p>
                            </div>
                            @endif

                            <!-- Invite Code Box -->
                            <div style="margin: 32px 0; padding: 24px; background: linear-gradient(135deg, #337cbf 0%, #2563eb 100%); border-radius: 12px; text-align: center;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 1px;">
                                    Jouw uitnodigingscode
                                </p>
                                <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; font-family: 'SF Mono', Monaco, Consolas, monospace; letter-spacing: 4px;">
                                    {{ $inviteCode }}
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 8px 0 24px;">
                                        <a href="{{ $loginUrl }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #337cbf 0%, #2563eb 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 14px rgba(51, 124, 191, 0.4);">
                                            Spelen! ❄️
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748b; text-align: center;">
                                Of ga naar <a href="{{ $loginUrl }}" style="color: #337cbf; text-decoration: none;">{{ $loginUrl }}</a><br>
                                en voer je code in.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-radius: 0 0 16px 16px; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                                ❄️ Skwix – Het winterse woordspel ❄️
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

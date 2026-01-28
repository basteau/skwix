<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Je bent uitgenodigd voor Skwix!</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fa; -webkit-font-smoothing: antialiased;">
    <!-- Dark mode styles -->
    <style>
        @media (prefers-color-scheme: dark) {
            .email-bg { background-color: #1a1d23 !important; }
            .card-bg { background-color: #252830 !important; }
            .text-primary { color: #f1f5f9 !important; }
            .text-secondary { color: #94a3b8 !important; }
            .text-muted { color: #64748b !important; }
            .footer-bg { background-color: #1e2128 !important; }
            .date-box { background-color: #2d323c !important; }
        }
    </style>

    <table role="presentation" class="email-bg" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <!-- Main Card -->
                <table role="presentation" class="card-bg" style="max-width: 440px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 40px rgba(51, 100, 170, 0.08);">
                    
                    <!-- Header - Playful Winter Banner -->
                    <tr>
                        <td style="padding: 0;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #3b6eb5; background: linear-gradient(135deg, #3b6eb5 0%, #2a5298 50%, #1e3a6e 100%);">
                                <tr>
                                    <td style="padding: 36px 24px 30px; text-align: center;">
                                        <!-- Snowflake cluster -->
                                        <table role="presentation" style="margin: 0 auto 20px;">
                                            <tr>
                                                <td style="font-size: 20px; opacity: 0.5; padding: 0 4px;">❄</td>
                                                <td style="font-size: 36px; padding: 0 6px;">❄️</td>
                                                <td style="font-size: 20px; opacity: 0.5; padding: 0 4px;">❄</td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Title -->
                                        <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                            Skwix
                                        </h1>
                                        <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.85); font-weight: 500;">
                                            Het winterse woordspel
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            @if($avatarUrl)
                            <!-- Player Avatar -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                <tr>
                                    <td align="center">
                                        <img src="{{ $avatarUrl }}" alt="{{ $playerName }}" width="80" height="80" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #3b6eb5; object-fit: cover; display: block;">
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- Greeting -->
                            <p class="text-primary" style="margin: 0 0 20px; font-size: 17px; line-height: 1.5; color: #1e293b;{{ $avatarUrl ? ' text-align: center;' : '' }}">
                                Hoi <strong>{{ $playerName }}</strong>! 👋
                            </p>
                            
                            <p class="text-secondary" style="margin: 0 0 28px; font-size: 15px; line-height: 1.65; color: #475569;">
                                Je bent uitgenodigd voor een potje Skwix – los puzzels op, stel vragen en draai aan het rad. Wie als eerste het geheime woord raadt wint!
                            </p>

                            @if($startsAt)
                            <!-- Start Date Box -->
                            <table role="presentation" class="date-box" style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 16px 20px; background-color: #f8fafc; border-radius: 12px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="width: 40px; vertical-align: middle;">
                                                    <span style="font-size: 24px;">📅</span>
                                                </td>
                                                <td style="vertical-align: middle;">
                                                    <p class="text-muted" style="margin: 0 0 2px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">
                                                        Het spel start op:
                                                    </p>
                                                    <p class="text-primary" style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">
                                                        {{ $startsAt }}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- Invite Code - Focal Point -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 28px 20px; background-color: #3b6eb5; background: linear-gradient(145deg, #3b6eb5 0%, #2a5298 100%); border-radius: 16px; text-align: center;">
                                        <p style="margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.7); font-weight: 600;">
                                            Jouw code
                                        </p>
                                        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace; letter-spacing: 6px;">
                                            {{ $inviteCode }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                        <a href="{{ $loginUrl }}" style="display: inline-block; padding: 16px 48px; background-color: #3b6eb5; background: linear-gradient(135deg, #3b6eb5 0%, #2a5298 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(59, 110, 181, 0.35); letter-spacing: 0.3px;">
                                            Spelen! ❄️
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8; text-align: center;">
                                Ga naar skwix.example en voer je code in
                            </p>
                        </td>
                    </tr>

                    <!-- Ski Family Photo -->
                    <tr>
                        <td style="padding: 0 28px 28px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <p class="text-secondary" style="margin: 0 0 16px; font-size: 15px; color: #475569; font-weight: 500;">
                                            Geniet nog van de skireis! ⛷️
                                        </p>
                                        <img src="{{ url('/images/ski_group_family.png') }}" alt="Ski groepsfoto" style="max-width: 100%; height: auto; border-radius: 12px; display: block;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td class="footer-bg" style="padding: 20px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p class="text-muted" style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                                ❄️ Skwix • Raad het woord, versla je vrienden ❄️
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Unsubscribe / Footer text outside card -->
                <table role="presentation" style="max-width: 440px; width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 24px 16px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Je ontvangt deze mail omdat je bent uitgenodigd voor een spel.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

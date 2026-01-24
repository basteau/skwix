<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>{{ $isWinner ? 'Je hebt gewonnen!' : 'Skwix is afgelopen' }}</title>
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
            .stats-box { background-color: #2d323c !important; }
        }
    </style>

    <table role="presentation" class="email-bg" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <!-- Main Card -->
                <table role="presentation" class="card-bg" style="max-width: 440px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 40px rgba(51, 100, 170, 0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 0;">
                            @if($isWinner)
                            <!-- Winner Header - Gold -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #d4a84b 0%, #b8942e 50%, #9a7b24 100%);">
                                <tr>
                                    <td style="padding: 36px 24px 30px; text-align: center;">
                                        <table role="presentation" style="margin: 0 auto 16px;">
                                            <tr>
                                                <td style="font-size: 48px;">🏆</td>
                                            </tr>
                                        </table>
                                        <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                            Gefeliciteerd!
                                        </h1>
                                        <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.9); font-weight: 500;">
                                            Je hebt Skwix gewonnen
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            @else
                            <!-- Non-winner Header - Winter Blue -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #3b6eb5 0%, #2a5298 50%, #1e3a6e 100%);">
                                <tr>
                                    <td style="padding: 36px 24px 30px; text-align: center;">
                                        <table role="presentation" style="margin: 0 auto 16px;">
                                            <tr>
                                                <td style="font-size: 20px; opacity: 0.5; padding: 0 4px;">❄</td>
                                                <td style="font-size: 36px; padding: 0 6px;">❄️</td>
                                                <td style="font-size: 20px; opacity: 0.5; padding: 0 4px;">❄</td>
                                            </tr>
                                        </table>
                                        <h1 style="margin: 0 0 6px; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                            Spel Afgelopen
                                        </h1>
                                        <p style="margin: 0; font-size: 15px; color: rgba(255,255,255,0.85); font-weight: 500;">
                                            Skwix is beëindigd
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            @endif
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            <!-- Greeting -->
                            <p class="text-primary" style="margin: 0 0 20px; font-size: 17px; line-height: 1.5; color: #1e293b;">
                                Hoi <strong>{{ $recipientName }}</strong>! 👋
                            </p>
                            
                            @if($isWinner)
                            <p class="text-secondary" style="margin: 0 0 28px; font-size: 15px; line-height: 1.65; color: #475569;">
                                Wat een prestatie! Je hebt het geheime woord geraden en bent als winnaar uit de bus gekomen. Ga naar de app om je prijs te bekijken!
                            </p>
                            @else
                            <p class="text-secondary" style="margin: 0 0 28px; font-size: 15px; line-height: 1.65; color: #475569;">
                                Het spel is afgelopen. @if($winnerName){{ $winnerName }} heeft gewonnen met {{ $winnerPoints }} punten. @else Er was geen duidelijke winnaar (gelijke stand). @endif Bedankt voor het meespelen!
                            </p>
                            @endif

                            <!-- Secret Word Reveal -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px; background: linear-gradient(145deg, #3b6eb5 0%, #2a5298 100%); border-radius: 16px; text-align: center;">
                                        <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.7); font-weight: 600;">
                                            Het geheime woord was
                                        </p>
                                        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace; letter-spacing: 4px; text-transform: uppercase;">
                                            {{ $secretWord }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Your Stats Box -->
                            <table role="presentation" class="stats-box" style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8fafc; border-radius: 12px;">
                                        <p class="text-muted" style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">
                                            Jouw resultaat
                                        </p>
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="width: 50%; padding-right: 8px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="vertical-align: middle;">
                                                                <span style="font-size: 24px;">🎯</span>
                                                            </td>
                                                            <td style="vertical-align: middle; padding-left: 8px;">
                                                                <p class="text-primary" style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b;">{{ $recipientPoints }}</p>
                                                                <p class="text-muted" style="margin: 0; font-size: 11px; color: #64748b;">punten</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td style="width: 50%; padding-left: 8px;">
                                                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                        <tr>
                                                            <td style="vertical-align: middle;">
                                                                <span style="font-size: 24px;">{{ $recipientRank === 1 ? '🥇' : ($recipientRank === 2 ? '🥈' : ($recipientRank === 3 ? '🥉' : '📊')) }}</span>
                                                            </td>
                                                            <td style="vertical-align: middle; padding-left: 8px;">
                                                                <p class="text-primary" style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b;">#{{ $recipientRank }}</p>
                                                                <p class="text-muted" style="margin: 0; font-size: 11px; color: #64748b;">van {{ $totalPlayers }}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0 0 20px;">
                                        @if($isWinner)
                                        <a href="{{ $resultsUrl }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #d4a84b 0%, #b8942e 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(180, 148, 46, 0.35); letter-spacing: 0.3px;">
                                            Bekijk je prijs 🏆
                                        </a>
                                        @else
                                        <a href="{{ $resultsUrl }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #3b6eb5 0%, #2a5298 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(59, 110, 181, 0.35); letter-spacing: 0.3px;">
                                            Bekijk resultaten ❄️
                                        </a>
                                        @endif
                                    </td>
                                </tr>
                            </table>

                            <p class="text-muted" style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8; text-align: center;">
                                Bedankt voor het meespelen!
                            </p>
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

                <!-- Footer text outside card -->
                <table role="presentation" style="max-width: 440px; width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 24px 16px; text-align: center;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Je ontvangt deze mail omdat je hebt deelgenomen aan een Skwix spel.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

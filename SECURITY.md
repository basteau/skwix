# Security and public-source hygiene

- Keep production environment files, credentials, cookies, database files, logs, screenshots, and private exports outside Git. `.gitignore` helps with new files; it cannot protect secrets added to already tracked files.
- `.env.example` and `.env.e2e` are sanitized templates. The E2E admin token is deliberately public test data, not a production credential. Use `php artisan key:generate` and a unique random `ADMIN_SECRET_TOKEN` for every deployment.
- The `/sudo/{token}` route grants administrative access. Treat its token as a password, require HTTPS, and keep it out of URLs shared in screenshots, analytics, and logs. Do not use the test token outside isolated tests.
- Demo identities are anonymized. All published raster artwork consists of generated placeholders, with no original photos or image metadata.
- This public copy was scanned with Gitleaks across Git history and every retained historical text blob before publication. Automated scanning cannot prove the absence of all secrets. Review changes before committing.
- If a real credential is ever committed, revoke/rotate it immediately. Deleting it in a later commit does not remove it from history.
- GitHub Actions are intentionally disabled for this repository. No production secrets, deployment hooks, or live infrastructure configuration are supplied.

# Admin password and redeploy (do this once)

1. Open your Google Sheet > Extensions > Apps Script.
2. Add a new Script file named `Admin` and paste `Admin.gs`. Save (Ctrl+S).
3. Left side, click the gear (Project Settings). Scroll to **Script properties** > **Add script property**.
   Property: `ADMIN_PASSWORD`   Value: your own strong password (12+ characters). Save. Never share it.
4. Deploy > Manage deployments > pencil (Edit) > Version: **New version** > Deploy. (Same URL stays.)
5. Open your-site/admin/ and log in.
After 5 wrong passwords the login locks for 15 minutes. Logins last about 6 hours.

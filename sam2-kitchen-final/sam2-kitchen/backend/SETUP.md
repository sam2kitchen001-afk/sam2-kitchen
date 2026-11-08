# Phase 2 setup: Google Sheet + menu API (about 10 minutes, free)

1. Go to sheets.google.com and create a blank spreadsheet named "SAM2 Kitchen Menu".
2. Click Extensions > Apps Script. Delete the sample code.
3. Create two files: paste Code.gs into the default file, then click + > Script and name it Menu, and paste Menu.gs.
4. Select `setupSheets` in the function dropdown and click Run. Approve the permission prompt
   (Advanced > Go to project > Allow). Your 5 tabs appear with DEMO data.
5. Click Deploy > New deployment > type "Web app".
   Execute as: Me. Who has access: Anyone. Click Deploy, then copy the Web app URL.
6. Open that URL with ?action=menu at the end. You should see JSON.
7. Paste the URL into js/config.js as API_URL.
8. To change menu code later use Deploy > Manage deployments > Edit > New version
   (this keeps the same URL; "New deployment" would create a different URL).

Daily menu: in the DailyMenu tab, either fill Day (e.g. Monday, repeats weekly) or Date (yyyy-mm-dd, for one specific day).
Product IDs must be unique across Products and Deals (use P1, P2... and D1, D2...).
A product only shows if Published is ticked and its Category matches an active row in Categories.

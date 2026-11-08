# Photo upload setup (Cloudinary, free, no card needed)

1. Go to cloudinary.com and click Sign up for free. Verify your email.
2. Open the Dashboard. Note your **Cloud name**. Go to Settings (gear) > API Keys (or "Access Keys") and note the **API Key**; click the eye icon to reveal the **API Secret**.
3. Google Sheet > Extensions > Apps Script > Project Settings (gear) > Script properties > Add script property, three times:
   - `CLOUDINARY_CLOUD_NAME`  = your cloud name
   - `CLOUDINARY_API_KEY`    = your API key
   - `CLOUDINARY_API_SECRET` = your API secret  (never share this with anyone, including me)
4. Paste the new `Admin.gs` over the old one and save. Deploy > Manage deployments > pencil > New version > Deploy.
5. Admin > Products > Edit > Upload photo > choose a photo > wait for "Photo uploaded" > Save.
Photos are resized in your browser before upload, and Cloudinary serves them in a small, fast format automatically.

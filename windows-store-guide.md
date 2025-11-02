# Peak Card Game - Windows Store Submission Guide

## Prerequisites
1. Windows developer account ($19 USD one-time fee)
2. Your deployed web app (✅ Already at: https://peakgame-19c4e.web.app)
3. Proper PWA manifest (✅ Already configured)

## Step-by-Step Process

### 1. Generate Windows Package with PWABuilder
```
1. Visit: https://www.pwabuilder.com
2. Enter URL: https://peakgame-19c4e.web.app
3. Click "Start"
4. Wait for analysis (should show all green checkmarks)
5. Click "Package for stores" → Windows
6. Fill in the Windows Store form:
   - Package ID: com.enochaseks.peakgame (or your identifier)
   - Publisher Display Name: Your Name/Company
   - App Version: 1.0.0.0
7. Download the .msix package
```

### 2. Register as Developer
```
1. Go to: https://developer.microsoft.com/windows/register
2. Sign in with Microsoft account
3. Pay $19 USD registration fee
4. Verify publisher identity
5. Go to: https://partner.microsoft.com/dashboard
```

### 3. Create App Submission
```
1. In Partner Center Dashboard, click "Create new app"
2. Reserve app name: "Peak Card Game"
3. Fill in Product information:
   - Category: Games
   - Subcategory: Card & board games
4. Fill in Properties:
   - Pricing: Free
   - Game rating: Fill appropriate age rating
5. Upload .msix package to Packages section
6. Add store listing details:
   - Description: Copy from manifest
   - Screenshots: At least 2 (1920x1080 or better)
   - Promotional images
7. Review and submit
```

### 4. During Review
- Microsoft will review (typically 24-48 hours)
- May ask for:
  - Screenshots
  - Verification it's not a wrapper without value
  - Gameplay demonstration if needed

## Important Notes
- Your web app must be accessible (✅ Already deployed on Firebase)
- Manifest must be valid PWA (✅ Already configured)
- Consider adding a dedicated store listing page
- Prepare 2-3 screenshots of actual gameplay
- Have a clear privacy policy linked

## Recommended Next Steps
1. Take screenshots for store listing
2. Create a publisher account
3. Use PWABuilder to generate .msix
4. Submit to Microsoft Store
5. Set up automatic update system (PWABuilder handles this)

## Support
- PWABuilder docs: https://www.pwabuilder.com/docs
- Microsoft Store docs: https://docs.microsoft.com/en-us/windows/apps/publish

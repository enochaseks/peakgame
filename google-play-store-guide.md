# Peak Card Game - Google Play Store Submission Guide

## Prerequisites
1. Google Play Developer account ($25 USD one-time fee - if you don't have one already)
2. Your deployed web app (✅ Already at: https://peakgame-19c4e.web.app)
3. Proper PWA manifest (✅ Already configured)

## Step-by-Step Process

### 1. Generate Android Package with PWABuilder
```
1. Visit: https://www.pwabuilder.com
2. Enter URL: https://peakgame-19c4e.web.app
3. Click "Start"
4. Wait for analysis (should show all green checkmarks)
5. Click "Package for stores" → Android
6. Fill in the Android form:
   - Package name: com.enochaseks.peakgame (or similar)
   - App name: Peak Card Game
   - Launcher icon: Will use from manifest
   - Theme color: #667eea (from your manifest)
   - Signing key: Generate new or use existing
7. Download the .apk or .aab (Android App Bundle) file
```

### 2. Register as Google Play Developer (if needed)
```
1. Go to: https://play.google.com/console
2. Click "Create account" or sign in
3. Pay $25 USD registration fee (one-time)
4. Complete developer profile:
   - Developer name
   - Contact info
   - Store listing address
```

### 3. Create App on Google Play Console
```
1. In Google Play Console, click "Create app"
2. Enter app name: "Peak Card Game"
3. Choose default language: English
4. Select app type: Game
5. Select category: Card
```

### 4. Fill in App Details
```
1. Go to "App content" section:
   - Content rating: Complete questionnaire
   - Target audience: Select appropriate ages
   
2. Go to "Pricing & distribution":
   - Free or Paid (recommend Free initially)
   - Countries: Select where to distribute
   
3. Go to "App listing":
   - Short description (80 chars max)
   - Full description
   - Screenshots: Upload at least 2
     * Recommended: 1080x1920 pixels
     * Show actual gameplay
   - Feature graphic: 1024x500 pixels
   - Icon: 512x512 pixels
```

### 5. Upload APK/AAB
```
1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload your .apk or .aab file from PWABuilder
4. Add release notes: "Initial release of Peak Card Game"
5. Review all info and click "Review release"
```

### 6. Submit for Review
```
1. Complete all required fields (marked with *)
2. Accept Google Play policies
3. Click "Submit release"
4. Wait for Google Play review (typically 24-48 hours)
5. Monitor status in Console
```

## Important Notes for Google Play
- **APK vs AAB**: 
  - APK: Single file, works on one architecture
  - AAB (recommended): Multiple architectures, smaller downloads
  - PWABuilder can generate either
  
- **Package Name**: Must be unique, typically reverse domain (com.company.appname)
  - Examples: com.enochaseks.peakgame

- **Version Code**: Auto-increments with each build (1, 2, 3...)

- **Screenshots**: Critical for approval
  - Show actual gameplay
  - At least 2 required
  - Up to 8 recommended
  - Size: 1080x1920 pixels (portrait) or 1920x1080 (landscape)

- **Content Rating**: 
  - Complete the questionnaire
  - Influences visibility and rating
  - For a card game: typically PEGI 3 or equivalent

## Advantages of Google Play Store
✅ Only $25 one-time fee (vs $19 for Windows)
✅ Reaches Android users worldwide
✅ Web apps wrap as APK automatically with PWABuilder
✅ Easier approval process than Apple App Store
✅ Can also submit to other stores (Amazon, etc.)

## Testing Before Upload
```
1. Test on Android emulator/device
2. Verify all manifest icons load
3. Test offline functionality
4. Check all game functions work
5. Ensure proper screen scaling
```

## After Approval
- Your app will be live on Google Play Store
- Users can search for "Peak Card Game"
- Automatic updates when you deploy new web version
- Monitor reviews and ratings
- Update app listing as needed

## Recommended Next Steps
1. Take 3-4 screenshots of actual gameplay
2. Create 1024x500 feature graphic
3. Use PWABuilder to generate Android package
4. Upload to Google Play Console
5. Submit for review
6. Celebrate! 🎉

## Useful Links
- PWABuilder: https://www.pwabuilder.com
- Google Play Console: https://play.google.com/console
- Android guidelines: https://developer.android.com/google-play
- App Store Connect: https://appstoreconnect.apple.com (for iOS later)

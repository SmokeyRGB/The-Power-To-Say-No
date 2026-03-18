## Installation of Userscripts

1. Install [ViolentMonkey](https://violentmonkey.github.io/) browser extension
2. Click the ViolentMonkey icon in your toolbar
3. Click the '+' icon to create a new script
4. Open any script file from this repo, and copy its content into the newly created ViolentMonkey script.
5. (If not already enabled) Click "Enable" to activate the script

# The Power to Say NO

Let’s be honest: YouTube’s interface is designed to frustrate you.

By default, marking a video as "Not Interested" is a chore. You’re forced to navigate a nested menu structure hidden behind a "more options" dropdown on every single video card. It’s tedious, unnecessary, and clearly not designed for convenience.

But the absurdity doesn't stop there. Once you finally find the option, to really give feedback to the algorithm, YouTube demands you to send your mouse on a journey over your whole desk requiring cursor to traverse the entire page for a simple checkbox select. It’s as if the platform actively discourages you from refining its algorithm, turning two necessary clicks into double the amount and giving you a repetitive strain injury from mouse movement.

This ViolentMonkey script cuts through the nonsense. It bypasses the bureaucratic nightmare of YouTube’s UI, allowing you to instantly suppress unwanted content and provide feedback without the physical exertion of a mouse marathon. Stop wrestling with the interface and start actually controlling your feed.

## Usage

1. Navigate to YouTube's Homepage with video thumbnails
2. Hover over any video thumbnail
3. A small `❌` button will appear (becomes visible on hover)
4. Click the button to mark the video as "Not Interested"
5. The script will:
   - Open the video options menu
   - Select "Not Interested"
   - Move the feedback form to the video card for easier access
   - Auto-submit when you select a reason

## Troubleshooting

### Button not appearing
- Ensure ViolentMonkey is properly installed and the script is enabled
- Try refreshing the page
- Check browser console for errors (enable DEBUG mode to see detailed logs)

### Script not working on some videos
- YouTube frequently updates its UI structure
- The script uses multiple fallback strategies to maintain compatibility
- If issues persist, the author may need to update selectors

### Feedback form not appearing
- The script waits for YouTube to populate the feedback dialog
- If the dialog doesn't appear within the timeout period, the script will fall back to YouTube's normal behavior

## Logging

Enable debug mode by setting `CONFIG.DEBUG = true` to see detailed console logs:

```javascript
const CONFIG = {
    DEBUG: true,  // Enable verbose logging
};
```

Logs will be prefixed with `[NotInterested]` in the browser console.

# YouTube Notification Wall

When you have many tabs open on YouTube, notification badges pile up and transform your tab bar into a chaotic mess of truncated titles like `[(5) Ho..] [(5) Th..] [(5) A n..]`. The YouTube Notification Wall userscript declutters this visual noise by automatically removing the notification count prefixes from each tab's title, restoring clarity to your browser window.

## Logging

The script logs found patterns to the browser console for debugging purposes. When a notification count pattern (e.g., `(5)`) is detected at the beginning of a page title, the console displays a message in the format: `YouTube Notification Wall - Found pattern: (5)Home`. This allows you to verify that the script is correctly identifying notification badges and processing them as expected.

---
---

## Author

**SmokeyRGB**

## License

These UserScripts are provided as-is. Feel free to modify and use as needed.

## Disclaimer

This scripts enhances YouTube's native functionalites or usage. It does not bypass any YouTube features or violate YouTube's Terms of Service. Use responsibly.

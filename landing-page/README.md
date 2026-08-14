# GLOWGRAM Landing Page

This is a standalone static landing page for the GLOWGRAM PWA.

## Files

- `index.html` - page markup and SEO basics
- `styles.css` - full responsive visual design
- `script.js` - download/install button behavior

## Download Button

The button currently points to:

```text
https://afunwa-hairline.vercel.app/
```

If you host this landing page on the same domain as the PWA, browsers that support PWA installation can show the native install prompt. If it is hosted on another domain, the button opens the live app so users can install it from their browser menu.

## Device Frame

The iPhone frame uses the MIT-licensed `@sneas/telephone` web component from:

```text
https://github.com/sneas/telephone
```

It renders the app preview inside an SVG iPhone 16 Max frame.

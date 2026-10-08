// Adds home-screen install tags to the exported web app, so "Add to Home Screen"
// gives a full-screen TrainHog with the Snout barbell icon.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const base = process.env.BASE_URL || '';
const file = 'dist/index.html';
const tags = [
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="TrainHog">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="theme-color" content="#F5F7FB">',
].join('\n');
let html = readFileSync(file, 'utf8').replace('</head>', `${tags}\n</head>`);
html = html.replace(/<meta name="viewport" content="([^"]*)"/, (m, c) => (c.includes('viewport-fit') ? m : `<meta name="viewport" content="${c}, viewport-fit=cover"`));
writeFileSync(file, html);
// GitHub Pages serves 404.html for unknown paths, which lets deep links open the app.
copyFileSync(file, 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
console.log('PWA tags added');

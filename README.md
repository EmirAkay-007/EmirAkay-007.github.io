# emirakay-007.github.io

Personal site of **Hüseyin Emir Akay**, a Computer Engineering student at Atatürk University who builds ground control station and operator interface software for unmanned aerial vehicles.

**Live:** https://emirakay-007.github.io

## What is in this repository

```
.
├── index.html          The page itself
├── 404.html            Shown for addresses that do not exist
├── assets/
│   ├── css/style.css   Colours, type and layout
│   ├── fonts/          Gelasio, used only on devices without Georgia (SIL Open Font License, see OFL.txt)
│   └── img/            Portrait, project screenshots and icons
├── sitemap.xml         List of pages for search engines
├── robots.txt          Allows crawling and points to the sitemap
└── .nojekyll           Tells GitHub Pages to publish the files as they are
```

The site is plain HTML and CSS: no framework, no build step and no JavaScript.

## Preview locally

Open `index.html` in a browser. To test it exactly as it is served, run a small local server from the repository folder:

```
python -m http.server 8000
```

and open http://localhost:8000.

## Publishing

GitHub Pages serves the `main` branch from the repository root. Every push to `main` updates the live site within a minute or two.

## Copyright

© 2026 Hüseyin Emir Akay. All rights reserved. The text, portrait and layout of this site may not be reused without permission.

The project screenshots come from the linked repositories ([SihaInterface](https://github.com/EmirAkay-007/SihaInterface), [C-_interface_mavlink](https://github.com/EmirAkay-007/C-_interface_mavlink)) and remain under their own terms. The Gelasio font files are licensed separately under the SIL Open Font License 1.1.

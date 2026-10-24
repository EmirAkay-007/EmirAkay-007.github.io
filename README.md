# emirakay-007.github.io

Personal site of **Hüseyin Emir Akay**, a Computer Engineering student at Atatürk University who builds ground control station and operator interface software for unmanned aerial vehicles.

**Live:** https://emirakay-007.github.io

## What is in this repository

```
.
├── index.html            The main page
├── cv.html               The CV as a web page (view only)
├── 404.html              Shown for addresses that do not exist
├── assets/
│   ├── css/style.css     Colours, type, layout and the scroll states
│   ├── js/main.js        Scroll behaviour (optional, see below)
│   ├── fonts/            Literata and B612 Mono, with their licences
│   ├── img/              Portrait, photographs, screenshots and icons
│   ├── dive/             131 frames of the autonomous dive, from ArduPilot SITL and Gazebo
│   └── video/            The dive on the real aircraft, filmed from the ground
├── sitemap.xml           List of pages for search engines
├── robots.txt            Allows crawling and points to the sitemap
├── googlea3b72bf3bfb7d00d.html   Google Search Console ownership check: do not delete
└── .nojekyll             Tells GitHub Pages to publish the files as they are
```

The site is plain HTML, CSS and JavaScript: no framework, no build step and no third-party requests.

## How the page behaves

`assets/js/main.js` adds the scroll behaviour: the name docking into the header, the dive scrubbed frame by frame, the detector's fallback order, the ground station tours and the route of the flight log. The page is complete without it: with JavaScript off, every section is shown in its final state.

Visitors who ask their system for reduced motion, or for reduced data, get the same content without the scroll-driven animation.

## Preview locally

Run a small local server from the repository folder:

```
python -m http.server 8000
```

and open http://localhost:8000. Opening `index.html` directly from disk also works, but some browsers block the scripts of local files.

## Publishing

GitHub Pages serves the `main` branch from the repository root. Every push to `main` updates the live site within a minute or two.

Browsers keep `style.css`, `main.js` and images for a while. When one of them changes but keeps its name, raise the `?v=` number where `index.html` (and `404.html`, for the stylesheet) refers to it, so returning visitors get the new file.

## Type

- **Literata** (text and headings), copyright The Literata Project Authors.
- **B612 Mono** (figures, code identifiers and labels), copyright The B612 Project Authors. It was developed with Airbus for cockpit displays. Its character set has no Turkish letters (ğ, ş, ı, İ), so it is used only for figures and English labels.

Both are licensed under the SIL Open Font License 1.1; the licence texts are in `assets/fonts/`. The font files are subsets of the originals.

## Copyright

© 2026 Hüseyin Emir Akay. All rights reserved. The text, photographs, video and layout of this site may not be reused without permission.

The ground station screenshots come from the linked repositories ([SihaInterface](https://github.com/EmirAkay-007/SihaInterface), [C-_interface_mavlink](https://github.com/EmirAkay-007/C-_interface_mavlink)) and remain under their own terms. The font files are licensed separately under the SIL Open Font License 1.1.

# GalaXia GrooveLab

GalaXia GrooveLab is a free, browser-based music, voice, DJ and dancer playground. It runs entirely on your device and can be deployed as a static website on Vercel. No sign-up, API key or paid account required to use the app.

## What is working

- Responsive GarageBand-inspired studio with drag/drop and multi-file local library import. The file picker accepts all file types; actual audio/video playback or decoding depends on the device's browser codecs.
- Multitrack arrangement: stack up to 12 sound clips, set start offsets, volume and mute, preview combined audio, view waveforms, export mixes of up to 3 minutes as downloadable stereo WAV files. Exported mixes are added to the local library.
- Sixteen real-time microphone presets (including deep, chipmunk, alien, echo, radio, robotic, demon), effect-strength and input-level controls, live mic monitor and recording to the local library. Pitch shift uses AudioWorklet when supported. Use headphones to prevent feedback.
- Sixteen-step drum sequencer with four channels and adjustable BPM.
- Eight playable soundboard pads and custom imported sample replacement. Pad replacements persist in IndexedDB when storage is available; the default sounds are synthesized without downloads.
- Shuffle, previous/next, repeat off/all/one, progress seek, volume and fullscreen controls.
- Up to four customizable dancers in selectable **illustrated 2D SVG** and **procedural 3D WebGL** modes, with Katarina, Alice, Angelus, Spike, Nova, and custom profile presets, adjustable body silhouette, clothing, hair streaks, eye/skin/hair colors, and dance styles. Drag dancers around the app. Dancing animation appears when audio plays, then hides after inactivity. Desktop Chromium Document Picture-in-Picture can show a pop-out dancer over other windows.
- IndexedDB local library for files, recordings and exports, localStorage for sequences, arrangements and character designs.
- PWA manifest, icon and offline shell caching (installable from supported browsers after first visit). No user files or recordings are sent to a server.

## Run and deploy

Upload `index.html`, `core.js`, `dancers3d.js`, `sw.js`, `manifest.webmanifest`, `icon.svg` and the sample media into a new static Vercel project, or serve this folder over HTTPS or localhost. For local development, run `python -m http.server 8000` and visit `http://localhost:8000`.

If you create a GitHub repository, upload these files to its root, then import the repository into Vercel. No build command is necessary.

## Known browser/platform limitations

- iOS and Android browsers cannot display arbitrary always-on-top characters over third-party apps. On desktop Chromium browsers, Document Picture-in-Picture can put a dancer in a movable floating window. True Android-wide overlays require a separately installed native app with explicit system overlay permission. iOS does not permit general third-party overlays over other apps.
- A browser cannot play every file type even though any file may be imported and saved; non-playable files remain downloadable. Music files added to the arrangement must be decodable by Web Audio (WAV/MP3 typically work).
- Browser pitch-shift/monitoring latency depends on device and browser. Headphones are recommended and mic permission/HTTPS required.
- The browser may delete locally stored data when device storage is full or if browsing data is cleared. Back up recordings by downloading them. A PWA does not bypass this limit.
- This is a focused mini-studio, not a professional full GarageBand clone: it has no MIDI piano roll, VST hosting, time stretching, precision timeline drag/trim automation, or native audio drivers.

All sounds and illustrated characters are original programmatically created assets. This project has no purchased or hosted dependencies.

## Dual 2D / 3D character studio (v3)

In Dancers, choose **2D illustrated** or **3D dimensional** using the appearance switch. Both modes use the same saved customizations, character presets, random dance, beat sync, and dance intensity slider. The 3D models are procedurally built and rendered with WebGL using original geometry, with no external CDN or recurring cost. Supported WebGL browsers show 3D; otherwise the app falls back to 2D vectors. This is stylized character art, not photorealistic or full Sims quality. Live beat detection is approximate and depends on the audio spectrum: song rhythm is not a perfect BPM or onset tracker. Desktop PiP currently shows the 2D artwork, while 3D is shown inside the page.


## Dance engine V4 (2D + 3D)

New `rhythm.js` analyzes frequency-bin transients locally using spectral flux and estimates a dance-friendly BPM. In Auto mode, choreography responds to likely rhythmic onsets. In BPM Lock mode, movement follows the explicit tempo; the Tap Tempo button estimates BPM from taps. A 4/8/16-beat change interval controls random move transitions. Each named character has a weighted dance personality. Illustrated SVGs now have articulated head/arm/leg groups and 3D meshes crossfade between movement poses. The built-in sequencer uses its exact clock for dancer beats. No music is uploaded or sent to an external API.

**Accuracy:** General-purpose music-beat detection is heuristic. Sync can slip for complex rhythms, songs with no drums, or major tempo changes. BPM Lock / Tap Tempo is provided as the predictable fallback. Browsers on iOS cannot float a live, custom WebGL view over unrelated apps; desktop Document Picture-in-Picture and an iOS video-PiP preview have platform limits.
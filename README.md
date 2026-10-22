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


## Retro Visualizer & Choreography v5

Inspired by the **Microsoft Plus! Dancer** Windows XP desktop-dancer experience and the nostalgia of the old Windows Media Player visualizations, but **all artwork, geometry and Canvas rendering are newly written and original.** No proprietary visualizer DLLs, artwork, skins, animations or audio are bundled.

- Studio: choose 8 reactive visuals — Bars & Waves, Alchemy Orbs, Battery Pulse, Ambience Swirl, Starfield, Musical Colors/Plasma, Neon Tunnel and Oscilloscope — in 6 palettes. The **RETRO FULLSCREEN** button opens a responsive overlay with old-school blue media-player chrome and playback/preset buttons. Works on mobile and desktop without requiring the Fullscreen API. Use **Shuffle visuals** to automatically cycle modes while audio is active. Spectrum and waveform data is read locally with the browser Web Audio analyser.
- Four additional choreography families: Popstar/Feminine, Dark/Sultry Goth, Rockstar Headbang, Rave/EDM. The original seven move families remain. Strong-beat accents, synchronized-ish changeovers, nested forearms, separate upper/lower legs, torso and long-hair sway give 2D sprites more articulation. For WebGL-capable devices, 3D arms, hips, hair and layered skirts move as separate geometric segments. Characters automatically rotate through weighted style-specific choreography if Random Dance is enabled.
- **Important bug fix:** Dance motion now uses a continuously advancing beat clock. It keeps moving through quieter passages when automatic onset detection misses musical transients, instead of freezing after a single beat. Manual BPM Lock and Tap Tempo remain available; automatic rhythm estimation is still heuristic, not full music transcription.
- New character/outfit inspirations from uploaded visual references: Pinkstar/Y2K, Raven/gothic, Crimson/formal, Punk Riot/rockstar, Dark Prince, with pink glam, punk plaid, raven and crimson outfit options. These are original modular vector sprites, **not** the original reference photos or detailed photorealistic Sims models. Uploaded inspiration photos are not published as assets.
- Original in-page dancers can be dragged over the website. Existing platform limits for desktop PiP and iPhone video PiP still apply. iOS does not permit arbitrary true overlay windows above unrelated apps.

### How to try it

1. Import a playable song in Studio and tap Play.
2. Under **Audio pulse**, select a visualization and color palette, then tap **RETRO FULLSCREEN** to recreate the 2000s media-player viewing experience.
3. Go to **Dancers**, select a named character and dance style, tap **Add dancer**, enable **Random Dance** and **Beat Sync**, and pick **Change move after 4 beats** for varied choreography.
4. For steadier rhythm on difficult songs, select **BPM Lock** and tap tempo or enter your song's BPM.

### Performance considerations

Visuals render at an adaptive ~24 fps using Canvas 2D to keep phone battery use reasonable. Mobile browsers may throttle animation in background. 3D WebGL is automatically replaced by 2D when GPU/browser support is missing. Detailed animation rigging and foot locking will require further iteration, especially for the 3D figures. This is an independently made nostalgia-inspired music studio, not an official Microsoft product.

## GrooveLab v6 — Keyframed Dance Lab + expanded retro theater

**Free and local:** These upgrades run fully in your browser. No hosted character services, paid models, Microsoft binary assets, or app telemetry are required.

### Character animation

- **15 actual named dance routines** (instead of only sinusoidal torso rotation). New `choreo.js` defines eight-beat pose phrases with independent shoulder/upper-arm, forearm, torso, hip, upper-leg, shin, and head targets. The routines include Moonwalk, Disco Point, Vogue Poses and Body Roll in addition to Bounce, Sway, Goth, Shuffle, Hip-hop, Club, Wild, Popstar, Sultry, Headbang and Rave. Keyframes are eased and blended for smoother transitions.
- The **Silent dance preview** button lets you watch choreography and try outfits before importing music. It is silent and uses your currently selected BPM (a visual preview, not a real song analyzer).
- **New moves now** rotates through compatible routines immediately; the Random Dance toggle still automatically changes moves after 4, 8 or 16 beats.
- Saved dancers can now be **edited**: tap ✎ on a dancer, change their name/look/move/accent, and click **Save selected**. Their on-screen position is preserved.
- Additional original character looks: Midnight Siren, Goth Academy and Starlight. Choose gothic chokers, black wings, a dark crown or DJ headphones; existing presets and saved character designs continue to work. Wings and headwear are visible in 2D and approximated procedurally in 3D. The v8 art-sprite image cutouts were derived from reference images supplied by the project owner and are now included in this public project. Remove these assets if you do not want those images hosted publicly.
- Desktop pop-out and limited iOS video-PiP demonstrations retain their existing platform constraints. iPhone cannot run arbitrary custom floating dancers above other apps.

### Visualizer nostalgia

- **12 original music-reactive visualizations**: the earlier eight plus XP Ribbon Trails, Electric Sunburst, Spectrum Fountain and Digital Rain. All are original Canvas sketches made for GrooveLab, with no Windows Media Player library/assets.
- Two new palettes (Aero Ice and Neon Candy), and 8/16/30/60-second shuffle intervals.
- **📸 Save frame** / **📸 Snapshot** creates a PNG of your current visualizer (downloads depend on browser support and local storage).
- **Retro fullscreen theater** continues to work on phones and desktops. A small `v6 ✦` badge in the header distinguishes this version from old cached pages.

### Testing and limitations

The app's JavaScript passes `node --check` on the dance engine, 3D renderer, Canvas visualizer and application controller. A Playwright desktop + mobile smoke test covers 12 visually distinct visualizer modes, live keyframe changes, character editing/saving, preset accessories, silent preview, responsive layout and fullscreen theater controls, with no page script errors in the test environment. WebGL cannot initialize in the provided headless Chromium environment; the 2D fallback was checked but real 3D quality/performance needs validation on an actual iPhone, Android or supported desktop GPU. Precision onset detection remains heuristic; use BPM Lock or Tap Tempo when it drifts.


## v7 — Retro Clip Studio, playback workshop and new dancing

All capabilities below are implemented without paid APIs, sign-in, server-side media processing, or third-party analytics. The app is a static client-side PWA.

- **Retro Clip Studio:** Studio → Record a visualization video. Records up to 15, 30 or 60 seconds as WebM (Chromium) or MP4 where supported. Choose 16:9 landscape or 9:16 vertical. A dedicated canvas continuously draws the chosen visualizer and can composite the existing crew as articulated illustrated sprites, even when live character mode is 3D. The soundtrack is captured using Web Audio `MediaStreamAudioDestinationNode`. Supported MediaRecorder + canvas capture browsers save recordings to the local library and offer an explicit Save clip download link; a Share button appears only when the platform supports sharing a recorded file. Recorded videos are **not** uploaded to any cloud service. Recording needs user interaction; on unsupported iOS/browser combinations use the phone's built-in screen recorder. If a track is paused, recordings may be silent. A 60-second cap is used to reduce mobile memory and storage pressure.
- **Music playback workshop:** Set A and B points to repeat part of a song; playback speed 0.75×/1×/1.25×/1.5×; optional 15/30/60-minute sleep timer that pauses music after the requested interval. Loop markers reset when the track changes to avoid accidental jumps in another song. Sleep timers require the page to remain open; the browser may throttle timers in background.
- **Headphones and lock-screen integration:** Media Session API handlers for play, pause, stop, previous/next, seek backward/forward and seek-to. Local track title, playback state, and position are exposed to supported device controls. Availability and background operation remain subject to the browser and OS; iPhone does not permit unrestricted third-party-app overlays.
- **Retro visualizer tuning:** Visual sensitivity and afterglow trail sliders, with persistent per-device preferences. Existing shuffle, palettes, 12 modes, snapshot, and theater modes remain.
- **Search imported tracks:** Case-insensitive filter searches the currently displayed local playlist. It does not transmit track names anywhere.
- **18 dance phrases:** Salsa Steps, Robot Pop and Y2K Groove join the existing 15 original keyframed routines. Existing random switches, beat-reactive accents, character style preferences, and animated sprite parts remain. The algorithm does not guarantee perfect song rhythm detection.

### Quick test

1. Import a music file in Studio and start playback. Select a retro visual mode and adjust Sensitivity/Afterglow.
2. In Dancers create up to four performers. Leave the crew enabled and return to Studio.
3. Select portrait or landscape and press **Record video**, then **Finish clip**. Tap **Save clip**, or find the new file in Library.
4. Practice a musical phrase by pressing **Set start** and **Set end**. Use **Clear loop** when finished.
5. For an unsupported mobile browser, use the phone's screen-recording feature instead; browser support for MediaRecorder combinations varies.

### Developer testing

`python tests/test_v7.py` exercises desktop and emulated-mobile UI with Playwright Chromium. Video export was independently verified with `ffprobe` to contain video and an audio stream; `ffmpeg volumedetect` confirmed the audio track is not silent when test music was playing. This is not a guarantee that all mobile browsers support the same recording formats.


## v8 — Art Sprite Studio and safer character editor

The owner-provided visual-reference images inspired an **Art Sprites** presentation mode with 10 transparent, optimized WebP cutouts (`assets/sprites/*.webp`). Artwork retains the original aesthetic but moves as an intact cutout (music-reactive sway, bounce, subtle tilt); **it is not a skeleton-rigged image**. **Rigged 2D** is separately available for arm/leg movement, and **low-poly 3D** remains experimental, not Sims-quality. A three-way mode selector and cycle button distinguish them.

The character editor no longer gets buried beneath floating dancers: while editing, the overlay defaults to hidden and saved dancers appear in a dedicated rehearsal stage. Click a stage dancer to select it for editing. You can opt back into the over-page dancers when editing if desired, and separately adjust the floating dancers' scale. Existing saved dancers migrate their display mode to the new art mode once; preferences and crew objects remain on the device.

New Art Sprite controls provide a preset artwork selector, plus **Use my own character image** (PNG/WebP/JPEG) for per-character uploads. Uploaded images are resized locally to 700px on their longest side, saved with the character on the browser via localStorage, and are never uploaded to a server. A cutout/transparent image yields best results; a photo with a background stays rectangular. Art Sprite mode uses fixed-image animation, while the SVG rig mode remains editable using hair, clothing and color controls. 3D remains basic procedural geometry.

The Retro Clip Studio's character compositing now respects the current Art Sprite artwork rather than substituting the old SVG character, when a live image is present. Tested in Chromium on desktop and simulated mobile; desktop/mobile browser behavior may differ from iOS Safari. Audio onset detection is approximate.

**Privacy notice:** The bundled Art Sprite cutouts come from visual references shared for this project. The GitHub repository and hosted site are public; those bundled assets are publicly retrievable. User-uploaded custom images, imported music, and recordings remain local on the device.


## v9: expressive male silhouettes and rig

Experimental WebGL models now use narrower lower legs, broader masculine shoulders, stronger jawline and smaller eyes for Angelus, Spike and Dark Prince; leather coats gain swaying panels, layered lapels and a belt. WebGL is still procedural low-poly and cannot match detailed Sims-grade character meshes.\n

### v9 Rigged 2D improvements

Angelus, Spike and Dark Prince now use redesigned differentiated SVG character rigs: tapered jaws, restrained masculine eye design, separate hair silhouettes, tailored coats, articulated boots and arms. Updated beat-interpolated choreography adds secondary torso, hip, head, elbow and knee motions to avoid frozen intermediate poses. The rigged 2D mode preserves editable outfit palettes and existing local saved crews.


### v10 Face & motion polish

Based on the 3D/2D mobile screenshots, refined the procedural WebGL rig: 17% smaller male heads, less protruding eyes and tiny mouths, higher-resolution head geometry, layered tapered hair instead of thick strands, animated head tilt, pose-driven torso/hips/legs, narrower grounded footwork, refined coat highlights and softer lighting. Reduced whole-body stage tilt to stop characters looking like tilted cardboard. Made 2D Spike's blonde hair short and tousled rather than crowned, and increased stage figure readability. This remains a zero-dependency low-poly renderer; it is not a full quality game model or imported GLB rig.

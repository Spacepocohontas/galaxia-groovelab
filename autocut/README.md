# GalaXia AutoCut Studio — Variety Edition

This free, local-first music-video creator is part of GalaXia GrooveLab, hosted at /autocut/.

## Automatic social-style video editing

- **25 original editing templates** in Viral, Cinematic, Retro, and Experimental collections, searchable by name and mood.
- **24 canvas-based visual effects** including RGB glitches, VHS noise, neon, dreamy glow, halftone, kaleidoscope panels, mirrors, split frames, blur, and monochrome.
- **13 transition styles** including wipes, snaps, film burns, whip pans, spins, and dissolves.
- **13 animated camera motions**, reframing each shot differently.
- **Automatic variety** changes cut pacing, crop, speed, FX and camera motion. Avoid Repeats is ON by default: with two or more files, no adjacent scenes select the same source. With only one file, presentation still changes on each cut.
- **Beat-aware edits** estimate the BPM locally and tighten pacing in high-energy passages; BPM may be overridden.
- **Remix again / Surprise me** rerenders decisions with a new seed or template.
- **Per-shot controls** allow manual changes to footage, effect, motion, transition, and video speed (audio unaffected).
- **ChatGPT handoff** copies a project brief to ChatGPT and lets users paste a JSON shot plan back. This is a manual handoff, not an automatic ChatGPT API integration.

## Audio Duration Lock

Enabled by default. The original soundtrack duration determines the timeline end. The edit engine ensures every generated shot fills the complete length, trimming or looping visuals without ever altering the music.

The edit-plan timeline ends at exactly the decoded audio duration subject to floating-point precision. WebM browser MediaRecorder output is not guaranteed frame-accurate because its container length may differ by frames.

## Export, support and privacy

Uploaded media stays in the user's browser. Supported browsers render canvas + soundtrack to a downloadable WebM; JSON edit plan is available as a fallback. Long projects can exceed browser memory or be slow. Chrome/Edge desktop is the most reliable WebM option. iOS Safari may be limited.

A Soften bright flashes option defaults ON. These templates are original and inspired by modern social editing patterns; not affiliated with CapCut or TikTok.

## Development

The autocut folder is a static ES-module site. Serve the root over HTTP, open /autocut/, and use cd autocut && npm test for deterministic engine, DOM wiring, pacing, anti-repeat and duration-lock tests.


## New: creative analysis, FX combinations, simulated lip motion and playback performance

### Content-aware direction (local, free)
Click **Analyze & create MV prompt** after uploading a soundtrack and video/image clips. The editor samples up to 12 local source files (three still-frame samples per video), measuring color, brightness and frame-to-frame pixel changes. Song analysis uses BPM, waveform energy and approximate change points. Optional pasted lyrics provide keyword-based story hints. A tailored MV brief and five clickable prompt suggestions are generated automatically without an account or server-side media upload. These are rule-based, not a generative vision/language model: the editor does **not** recognize actual video subjects, transcribe vocals or infer lyrics from audio. Use **Copy MV brief** to hand the suggestion to ChatGPT, then optionally paste an AI-authored shot plan via the existing ChatGPT bridge.

### FX combination controls
Independent toggles for preset mixing, shuffled FX, shuffled camera movement, shuffled transitions and layered second-FX treatments. Disable a category if you want consistent handling (for example, steady camera movement while shuffling video colors). Every shot can be adjusted in the timeline editor.

### Performance and audio-master syncing
The old renderer repeatedly sought video frames every time it found drift above ~160 ms, sometimes worsening video lag. This version uses audio playback as the master clock, throttles expensive video seeks, introduces small video-only playback-rate corrections, tracks dropped or delayed frames where the browser supports requestVideoFrameCallback, and adjusts canvas preview resolution/framerate in Adaptive or Smooth mode. Set a manual video picture offset between -1200 and +1200 ms if your video decoder consistently lags. Positive values advance the picture relative to the song; the soundtrack audio is not shifted or sped up. Performance still depends on source codec/bitrate, available device CPU and browser, and live recording may drop frames. Use Smooth preview for heavy source footage. Output quality remains under your chosen export settings.

### Experimental music-reactive lip motion (disabled by default)
Toggle **Animate visible lips to music** to download an optional MediaPipe Face Landmarker model. Face landmarks and mouth-region warping then run on-device, with a strength slider. If you paste timestamped LRC lyrics (for example [00:12.50] I hear your voice) into the lyrics/story field, the editor uses approximate per-word cues in addition to audio energy. Without timed lyrics it follows music amplitude only.

**This is an approximate visual effect, not exact sung-word/phoneme lip-sync or generative mouth reenactment.** Video must visibly contain a detectable face, and the optional model requires an internet download. Face tracking may increase lag, so leave the toggle OFF for performance-sensitive edits. Accurate vocal-to-lip retargeting would require forced speech alignment, a trained mouth synthesis model, and substantially more processing than the static client editor currently offers.

### Fullscreen
Use the **Full screen** header button for the studio or **Expand** next to the video preview. A CSS fallback is available if the browser refuses the Fullscreen API. Press Escape or the same button to exit as supported.

### Validation
Run the existing Node tests; GitHub Actions also parses the new sync, local director and lip modules. These tests validate planning, settings wiring and source syntax, not real-world device decoder performance or every optional model/browser capability. Browser export can produce WebM or MP4 when its available MediaRecorder codecs support that format; final container runtime may differ by a few frames.

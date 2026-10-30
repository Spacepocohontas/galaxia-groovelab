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

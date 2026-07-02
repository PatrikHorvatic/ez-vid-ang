/**
 * Tree-shakeable SVG icon constants for the Eva video player.
 *
 * Import only the icons you need and register them with `addEvaIcons`:
 *
 * @example
 * // Register specific icons (best for bundle size)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaPlayIcon, evaPauseIcon, evaFullscreenIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaPlayIcon, evaPauseIcon, evaFullscreenIcon });
 *
 * @example
 * // Register all default icons (convenience)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaAllIcons } from 'ez-vid-ang/icons';
 * addEvaIcons(evaAllIcons);
 */

// ─── Playback ─────────────────────────────────────────────────────────────────

export const evaPlayIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

export const evaPauseIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

// ─── Seeking ──────────────────────────────────────────────────────────────────

export const evaForward10Icon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18,13c0,3.31-2.69,6-6,6s-6-2.69-6-6s2.69-6,6-6v4l5-5l-5-5v4c-4.42,0-8,3.58-8,8c0,4.42,3.58,8,8,8s8-3.58,8-8H18z"/><polygon points="10.86,15.94 10.86,11.67 10.77,11.67 9,12.3 9,12.99 10.01,12.68 10.01,15.94"/><path d="M12.25,13.44v0.74c0,1.9,1.31,1.82,1.44,1.82c0.14,0,1.44,0.09,1.44-1.82v-0.74c0-1.9-1.31-1.82-1.44-1.82C13.55,11.62,12.25,11.53,12.25,13.44z M14.29,13.32v0.97c0,0.77-0.21,1.03-0.59,1.03c-0.38,0-0.6-0.26-0.6-1.03v-0.97c0-0.75,0.22-1.01,0.59-1.01C14.07,12.3,14.29,12.57,14.29,13.32z"/></svg>`;

export const evaForward30Icon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18,13c0,3.31-2.69,6-6,6s-6-2.69-6-6s2.69-6,6-6v4l5-5l-5-5v4c-4.42,0-8,3.58-8,8c0,4.42,3.58,8,8,8s8-3.58,8-8H18z"/><path d="M10.06,15.38c-0.29,0-0.62-0.17-0.62-0.54H8.59c0,0.97,0.9,1.23,1.45,1.23c0.87,0,1.51-0.46,1.51-1.25c0-0.66-0.45-0.9-0.71-1c0.11-0.05,0.65-0.32,0.65-0.92c0-0.21-0.05-1.22-1.44-1.22c-0.62,0-1.4,0.35-1.4,1.16h0.85c0-0.34,0.31-0.48,0.57-0.48c0.59,0,0.58,0.5,0.58,0.54c0,0.52-0.41,0.59-0.63,0.59H9.56v0.66h0.45c0.65,0,0.7,0.42,0.7,0.64C10.71,15.11,10.5,15.38,10.06,15.38z"/><path d="M13.85,11.68c-0.14,0-1.44-0.08-1.44,1.82v0.74c0,1.9,1.31,1.82,1.44,1.82c0.14,0,1.44,0.09,1.44-1.82V13.5C15.3,11.59,13.99,11.68,13.85,11.68z M14.45,14.35c0,0.77-0.21,1.03-0.59,1.03c-0.38,0-0.6-0.26-0.6-1.03v-0.97c0-0.75,0.22-1.01,0.59-1.01c0.38,0,0.6,0.26,0.6,1.01V14.35z"/></svg>`;

export const evaBackward10Icon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.99,5V1l-5,5l5,5V7c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6h-2c0,4.42,3.58,8,8,8s8-3.58,8-8S16.41,5,11.99,5z"/><path d="M10.89,16h-0.85v-3.26l-1.01,0.31v-0.69l1.77-0.63h0.09V16z"/><path d="M15.17,14.24c0,0.32-0.03,0.6-0.1,0.82s-0.17,0.42-0.29,0.57s-0.28,0.26-0.45,0.33s-0.37,0.1-0.59,0.1s-0.41-0.03-0.59-0.1s-0.33-0.18-0.46-0.33s-0.23-0.34-0.3-0.57s-0.11-0.5-0.11-0.82V13.5c0-0.32,0.03-0.6,0.1-0.82s0.17-0.42,0.29-0.57s0.28-0.26,0.45-0.33s0.37-0.1,0.59-0.1s0.41,0.03,0.59,0.1c0.18,0.07,0.33,0.18,0.46,0.33s0.23,0.34,0.3,0.57s0.11,0.5,0.11,0.82V14.24z M14.32,13.38c0-0.19-0.01-0.35-0.04-0.48s-0.07-0.23-0.12-0.31s-0.11-0.14-0.19-0.17s-0.16-0.05-0.25-0.05s-0.18,0.02-0.25,0.05s-0.14,0.09-0.19,0.17s-0.09,0.18-0.12,0.31s-0.04,0.29-0.04,0.48v0.97c0,0.19,0.01,0.35,0.04,0.48s0.07,0.24,0.12,0.32s0.11,0.14,0.19,0.17s0.16,0.05,0.25,0.05s0.18-0.02,0.25-0.05s0.14-0.09,0.19-0.17s0.09-0.19,0.11-0.32s0.04-0.29,0.04-0.48V13.38z"/></svg>`;

export const evaBackward30Icon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12,5V1L7,6l5,5V7c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6H4c0,4.42,3.58,8,8,8s8-3.58,8-8S16.42,5,12,5z"/><path d="M9.56,13.49h0.45c0.21,0,0.37-0.05,0.48-0.16s0.16-0.25,0.16-0.43c0-0.08-0.01-0.15-0.04-0.22s-0.06-0.12-0.11-0.17s-0.11-0.09-0.18-0.11s-0.16-0.04-0.25-0.04c-0.08,0-0.15,0.01-0.22,0.03s-0.13,0.05-0.18,0.1s-0.09,0.09-0.12,0.15s-0.05,0.13-0.05,0.2H8.65c0-0.18,0.04-0.34,0.11-0.48s0.17-0.27,0.3-0.37s0.27-0.18,0.44-0.23s0.35-0.08,0.54-0.08c0.21,0,0.41,0.03,0.59,0.08s0.33,0.13,0.46,0.23s0.23,0.23,0.3,0.38s0.11,0.33,0.11,0.53c0,0.09-0.01,0.18-0.04,0.27s-0.07,0.17-0.13,0.25s-0.12,0.15-0.2,0.22s-0.17,0.12-0.28,0.17c0.24,0.09,0.42,0.21,0.54,0.39s0.18,0.38,0.18,0.61c0,0.2-0.04,0.38-0.12,0.53s-0.18,0.29-0.32,0.39s-0.29,0.19-0.48,0.24s-0.38,0.08-0.6,0.08c-0.18,0-0.36-0.02-0.53-0.07s-0.33-0.12-0.46-0.23s-0.25-0.23-0.33-0.38s-0.12-0.34-0.12-0.55h0.85c0,0.08,0.02,0.15,0.05,0.22s0.07,0.12,0.13,0.17s0.12,0.09,0.2,0.11s0.16,0.04,0.25,0.04c0.1,0,0.19-0.01,0.27-0.04s0.15-0.07,0.2-0.12s0.1-0.11,0.13-0.18s0.04-0.15,0.04-0.24c0-0.11-0.02-0.21-0.05-0.29s-0.08-0.15-0.14-0.2s-0.13-0.09-0.22-0.11s-0.18-0.04-0.29-0.04H9.56V13.49z"/><path d="M15.3,14.24c0,0.32-0.03,0.6-0.1,0.82s-0.17,0.42-0.29,0.57s-0.28,0.26-0.45,0.33s-0.37,0.1-0.59,0.1s-0.41-0.03-0.59-0.1s-0.33-0.18-0.46-0.33s-0.23-0.34-0.3-0.57s-0.11-0.5-0.11-0.82V13.5c0-0.32,0.03-0.6,0.1-0.82s0.17-0.42,0.29-0.57s0.28-0.26,0.45-0.33s0.37-0.1,0.59-0.1s0.41,0.03,0.59,0.1s0.33,0.18,0.46,0.33s0.23,0.34,0.3,0.57s0.11,0.5,0.11,0.82V14.24z M14.45,13.38c0-0.19-0.01-0.35-0.04-0.48c-0.03-0.13-0.07-0.23-0.12-0.31s-0.11-0.14-0.19-0.17s-0.16-0.05-0.25-0.05s-0.18,0.02-0.25,0.05s-0.14,0.09-0.19,0.17s-0.09,0.18-0.12,0.31s-0.04,0.29-0.04,0.48v0.97c0,0.19,0.01,0.35,0.04,0.48s0.07,0.24,0.12,0.32s0.11,0.14,0.19,0.17s0.16,0.05,0.25,0.05s0.18-0.02,0.25-0.05s0.14-0.09,0.19-0.17s0.09-0.19,0.11-0.32c0.03-0.13,0.04-0.29,0.04-0.48V13.38z"/></svg>`;

// ─── Volume ───────────────────────────────────────────────────────────────────

export const evaVolumeHighIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

export const evaVolumeMediumIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`;

export const evaVolumeLowIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>`;

export const evaVolumeMuteIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

// ─── UI Controls ──────────────────────────────────────────────────────────────

export const evaSettingsIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19.14,12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4,2.81c-.04-.24-.24-.41-.48-.41H9.07c-.24,0-.43.17-.47.41L8.24,5.35C7.65,5.59 7.11,5.92 6.62,6.29L4.24,5.33c-.22-.08-.47,0-.59.22L1.73,8.87c-.12.22-.07.47.12.61l2.03,1.58C3.84,11.36 3.8,11.69 3.8,12c0,.31.02.64.07.94L1.84,14.52c-.18.14-.23.41-.12.61l1.92,3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36,2.54c.05.24.24.41.48.41h3.84c.24,0,.44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47,0,.59-.22l1.92-3.32c.12-.22.07-.47-.12-.61ZM12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6 3.6,1.62,3.6,3.6-1.62,3.6-3.6,3.6z"/></svg>`;

// ─── Display ──────────────────────────────────────────────────────────────────

export const evaFullscreenIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;

export const evaFullscreenExitIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`;

export const evaCinemaModeIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20M4,6V18H20V6H4M6,8H18V16H6V8Z"/></svg>`;

export const evaLoopIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z"/></svg>`;

export const evaPictureInPictureIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19,11H11V17H19V11M23,19V5C23,3.88 22.1,3 21,3H3A2,2 0 0,0 1,5V19A2,2 0 0,0 3,21H21A2,2 0 0,0 23,19M21,19H3V4.97H21V19Z"/></svg>`;

export const evaRemotePlaybackIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1,10V12A9,9 0 0,1 10,21H12C12,14.92 7.07,10 1,10M1,14V16A5,5 0 0,1 6,21H8A7,7 0 0,0 1,14M1,18V21H4A3,3 0 0,0 1,18M21,3H3C1.89,3 1,3.89 1,5V8H3V5H21V19H14V21H21A2,2 0 0,0 23,19V5C23,3.89 22.1,3 21,3Z"/></svg>`;

export const evaDownloadIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>`;

export const evaScreenshotIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/></svg>`;

// ─── Convenience barrel ───────────────────────────────────────────────────────

/**
 * All default Eva icons in a single object.
 * Pass to `addEvaIcons` to register everything at once.
 */
export const evaAllIcons: Record<string, string> = {
  evaPlayIcon,
  evaPauseIcon,
  evaSettingsIcon,
  evaForward10Icon,
  evaForward30Icon,
  evaBackward10Icon,
  evaBackward30Icon,
  evaVolumeHighIcon,
  evaVolumeMediumIcon,
  evaVolumeLowIcon,
  evaVolumeMuteIcon,
  evaFullscreenIcon,
  evaFullscreenExitIcon,
  evaCinemaModeIcon,
  evaLoopIcon,
  evaPictureInPictureIcon,
  evaRemotePlaybackIcon,
  evaDownloadIcon,
  evaScreenshotIcon,
};

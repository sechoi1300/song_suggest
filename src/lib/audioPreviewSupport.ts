const APPLE_PREVIEW_TYPE = 'audio/mp4; codecs="mp4a.40.2"'

type PreviewAudio = Pick<HTMLMediaElement, 'canPlayType' | 'error'>

export function getAudioPreviewSupportError(audio: Pick<HTMLMediaElement, 'canPlayType'>): string | null {
  if (audio.canPlayType(APPLE_PREVIEW_TYPE)) return null
  return 'This browser cannot play Apple audio previews. Open this page in Chrome, Edge, or Safari instead of an editor\'s built-in browser.'
}

export function getAudioPreviewPlaybackError(audio: PreviewAudio, error?: unknown): string {
  const unsupported = getAudioPreviewSupportError(audio)
  if (unsupported) return unsupported
  if (error instanceof Error && error.name === 'NotAllowedError') {
    return 'Your browser blocked playback. Allow sound for this site, then click Play again.'
  }
  if (audio.error?.code === 3 || audio.error?.code === 4) {
    return 'This browser could not decode the preview. Try another track or open this page in Chrome, Edge, or Safari.'
  }
  return 'The preview could not load. Check your connection and try again.'
}

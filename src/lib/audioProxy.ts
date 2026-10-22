import https from 'node:https'
import { Readable } from 'node:stream'
import { appleHttpsAgent } from './appleHttp'

export function normalizeAudioUrl(value: string | null): URL | null {
  try {
    if (!value) return null
    const url = new URL(value)
    const allowed = url.hostname === 'audio-ssl.itunes.apple.com'
      || url.hostname === 'audio.itunes.apple.com'
      || url.hostname.endsWith('.mzstatic.com')
    if (!allowed || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null
    // Older iTunes previews use HTTP URLs; Apple's audio CDN supports HTTPS.
    url.protocol = 'https:'
    return url
  } catch {
    return null
  }
}

export async function proxyAppleAudio(value: string | null, range: string | null, redirects = 0): Promise<Response> {
  const url = normalizeAudioUrl(value)
  if (!url) return new Response('Invalid or unapproved audio URL', { status: 400 })

  return new Promise<Response>((resolve) => {
    const req = https.get(url, {
      agent: appleHttpsAgent,
      timeout: 10000,
      headers: { Accept: '*/*', ...(range ? { Range: range } : {}) },
    }, (upstream) => {
      const status = upstream.statusCode || 502
      if ([301, 302, 303, 307, 308].includes(status)) {
        upstream.resume()
        if (!upstream.headers.location || redirects >= 3) {
          resolve(new Response('Invalid audio redirect', { status: 502 }))
          return
        }
        let next: string
        try {
          next = new URL(upstream.headers.location, url).href
        } catch {
          resolve(new Response('Invalid audio redirect', { status: 502 }))
          return
        }
        if (!normalizeAudioUrl(next)) {
          resolve(new Response('Unapproved audio redirect', { status: 502 }))
          return
        }
        resolve(proxyAppleAudio(next, range, redirects + 1))
        return
      }
      if (status !== 200 && status !== 206) {
        upstream.resume()
        const headers = new Headers()
        if (upstream.headers['content-range']) headers.set('Content-Range', upstream.headers['content-range'])
        resolve(new Response('Audio preview unavailable', { status: status === 416 ? 416 : 502, headers }))
        return
      }
      const headers = new Headers({
        // Apple sometimes labels AAC/M4A previews as audio/x-m4p.
        'Content-Type': 'audio/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      })
      for (const name of ['content-length', 'content-range', 'etag', 'last-modified'] as const) {
        const value = upstream.headers[name]
        if (value) headers.set(name, value)
      }
      resolve(new Response(Readable.toWeb(upstream) as ReadableStream<Uint8Array>, { status, headers }))
    })
    req.on('timeout', () => {
      resolve(new Response('Upstream request timed out', { status: 504 }))
      req.destroy(new Error('Audio request timed out'))
    })
    req.on('error', () => resolve(new Response('Error loading audio preview', { status: 502 })))
  })
}

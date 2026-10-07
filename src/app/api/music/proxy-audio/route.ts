import { NextRequest } from 'next/server'
import https from 'https'
import { PassThrough, Readable } from 'stream'

export const dynamic = 'force-dynamic'

const allowedHosts = [
  'audio-ssl.itunes.apple.com',
  'audio.itunes.apple.com',
  'itunes.apple.com',
  'mzstatic.com',
]

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false
    }
    return allowedHosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl || !isAllowedUrl(targetUrl)) {
    return new Response('Invalid or unapproved audio URL', { status: 400 })
  }

  const clientRange = request.headers.get('range')

  return new Promise<Response>((resolve) => {
    const requestHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: '*/*',
    }

    if (clientRange) {
      requestHeaders['Range'] = clientRange
    }

    const agent = new https.Agent({ rejectUnauthorized: false })

    const req = https.get(
      targetUrl,
      {
        agent,
        headers: requestHeaders,
        timeout: 10000,
      },
      (upstreamRes) => {
        const status = upstreamRes.statusCode || 200

        const responseHeaders = new Headers()
        responseHeaders.set('Content-Type', upstreamRes.headers['content-type'] || 'audio/mp4')
        responseHeaders.set('Accept-Ranges', 'bytes')
        responseHeaders.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable')

        if (upstreamRes.headers['content-length']) {
          responseHeaders.set('Content-Length', upstreamRes.headers['content-length'])
        }
        if (upstreamRes.headers['content-range']) {
          responseHeaders.set('Content-Range', upstreamRes.headers['content-range'])
        }

        const pass = new PassThrough()
        upstreamRes.pipe(pass)

        resolve(
          new Response(Readable.toWeb(pass) as ReadableStream<Uint8Array>, {
            status,
            headers: responseHeaders,
          })
        )
      }
    )

    req.on('timeout', () => {
      req.destroy()
      resolve(new Response('Upstream request timed out', { status: 504 }))
    })

    req.on('error', (err) => {
      console.warn('Audio proxy request error:', err)
      resolve(new Response('Error proxying audio preview', { status: 502 }))
    })
  })
}

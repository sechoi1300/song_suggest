import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import https from 'node:https'
import type { ClientRequest, IncomingMessage } from 'node:http'
import { PassThrough } from 'node:stream'
import { test, type TestContext } from 'node:test'
import { normalizeAudioUrl, proxyAppleAudio } from '../src/lib/audioProxy'
import { parseTopAlbumsFeed } from '../src/lib/trendingAlbums'
import { getAudioPreviewSupportError, getAudioPreviewPlaybackError } from '../src/lib/audioPreviewSupport'

const audioUrl = 'https://audio-ssl.itunes.apple.com/itunes-assets/preview.m4a'

test('browsers without AAC receive an actionable explanation before playback', () => {
  let checkedType = ''
  const unsupported = getAudioPreviewSupportError({ canPlayType: (type) => { checkedType = type; return '' } })
  assert.equal(checkedType, 'audio/mp4; codecs="mp4a.40.2"')
  assert.match(unsupported!, /Chrome, Edge, or Safari/)
  assert.match(unsupported!, /built-in browser/)
  assert.equal(getAudioPreviewSupportError({ canPlayType: () => 'probably' }), null)
})

test('playback errors distinguish codec support, decoding, permissions, and transport', () => {
  const mediaError = (code: number) => ({ code, message: '', MEDIA_ERR_ABORTED: 1, MEDIA_ERR_NETWORK: 2, MEDIA_ERR_DECODE: 3, MEDIA_ERR_SRC_NOT_SUPPORTED: 4 }) as MediaError
  assert.match(getAudioPreviewPlaybackError({ canPlayType: () => '', error: mediaError(4) }), /built-in browser/)
  assert.match(getAudioPreviewPlaybackError({ canPlayType: () => 'maybe', error: mediaError(3) }), /decode/)
  assert.match(getAudioPreviewPlaybackError({ canPlayType: () => 'maybe', error: mediaError(2) }), /connection/)
  const permission = Object.assign(new Error('Blocked'), { name: 'NotAllowedError' })
  assert.match(getAudioPreviewPlaybackError({ canPlayType: () => 'maybe', error: null }, permission), /Allow sound/)
})

test('chart preserves the provider rank, full artist name, and original album IDs', () => {
  const entry = {
    id: { attributes: { 'im:id': '6815839963' } },
    'im:name': { label: 'An Album' },
    'im:artist': { label: 'Earth, Wind & Fire' },
    'im:releaseDate': { label: '2026-10-05T00:00:00-07:00' },
    'im:image': [{ label: 'https://is1-ssl.mzstatic.com/image/170x170bb.jpg' }],
    'im:itemCount': { label: '13' },
    category: { attributes: { label: 'Soul' } },
  }
  const entries = Array.from({ length: 12 }, (_, i) => ({
    ...entry, id: { attributes: { 'im:id': String(6815839963 + i) } },
  }))
  const chart = parseTopAlbumsFeed({ feed: { updated: { label: '2026-10-07T13:00:00-07:00' }, entry: entries } })
  assert.equal(chart.albums.length, 10)
  assert.equal(chart.albums[0].id, 'itunes-6815839963')
  assert.equal(chart.albums[9].chartRank, 10)
  assert.deepEqual(chart.albums[0].artist, ['Earth, Wind & Fire'])
  assert.equal(chart.albums[0].coverImageUrl, 'https://is1-ssl.mzstatic.com/image/600x600bb.jpg')
  assert.equal(chart.updatedAt, '2026-10-07T13:00:00-07:00')
})

test('an empty chart cannot silently become a preset catalog', () => {
  assert.throws(() => parseTopAlbumsFeed({ feed: { updated: { label: '' }, entry: [] } }), /empty or invalid/)
})

test('legacy HTTP previews upgrade to HTTPS and untrusted destinations are rejected', () => {
  assert.equal(normalizeAudioUrl(audioUrl.replace('https:', 'http:'))?.href, audioUrl)
  for (const url of [null, 'invalid', 'file:///etc/passwd', 'http://localhost:5432/',
    'https://audio-ssl.itunes.apple.com.evil.example/', 'https://evil-mzstatic.com/',
    'https://user:password@audio-ssl.itunes.apple.com/', 'https://audio-ssl.itunes.apple.com:8443/']) {
    assert.equal(normalizeAudioUrl(url), null)
  }
})

function stubUpstream(t: TestContext, replies: Array<{
  status: number
  headers?: Record<string, string>
  body?: Buffer
}>) {
  const requests: Array<{ url: string; headers: Record<string, string>; rejectUnauthorized?: boolean }> = []
  t.mock.method(https, 'get', (url: URL, options: https.RequestOptions, callback: (res: IncomingMessage) => void) => {
    requests.push({
      url: url.href,
      headers: options.headers as Record<string, string>,
      rejectUnauthorized: (options.agent as https.Agent).options.rejectUnauthorized,
    })
    const reply = replies.shift()
    assert.ok(reply, 'Unexpected upstream request')
    const req = new EventEmitter() as ClientRequest
    req.destroy = () => req
    queueMicrotask(() => {
      const upstream = new PassThrough() as unknown as IncomingMessage
      upstream.statusCode = reply.status
      upstream.headers = reply.headers || {}
      callback(upstream)
      ;(upstream as unknown as PassThrough).end(reply.body || Buffer.alloc(0))
    })
    return req
  })
  return requests
}

test('audio range responses contain audio bytes, playable MIME, and verified TLS', async (t) => {
  const bytes = Buffer.from('M4A preview bytes')
  const requests = stubUpstream(t, [{ status: 206, headers: {
    'content-type': 'audio/x-m4p', 'content-range': 'bytes 0-16/100', 'content-length': String(bytes.length),
  }, body: bytes }])
  const response = await proxyAppleAudio(audioUrl.replace('https:', 'http:'), 'bytes=0-16')
  assert.equal(response.status, 206)
  assert.equal(response.headers.get('content-type'), 'audio/mp4')
  assert.equal(response.headers.get('content-range'), 'bytes 0-16/100')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
  assert.equal(requests[0].url, audioUrl)
  assert.equal(requests[0].headers.Range, 'bytes=0-16')
  assert.notEqual(requests[0].rejectUnauthorized, false)
})

test('allowed redirects preserve Range, and redirects outside Apple are refused', async (t) => {
  const requests = stubUpstream(t, [
    { status: 302, headers: { location: '/next.m4a' } },
    { status: 200, body: Buffer.from('audio') },
    { status: 302, headers: { location: 'https://example.com/private' } },
  ])
  const response = await proxyAppleAudio(audioUrl, 'bytes=0-')
  assert.equal(await response.text(), 'audio')
  assert.equal(requests[1].headers.Range, 'bytes=0-')
  const blocked = await proxyAppleAudio(audioUrl, null)
  assert.equal(blocked.status, 502)
  assert.equal(requests.length, 3)
})

test('upstream failures are never served as successful audio', async (t) => {
  stubUpstream(t, [
    { status: 404, body: Buffer.from('<html>Not found</html>') },
    { status: 416, headers: { 'content-range': 'bytes */100' } },
  ])
  assert.equal((await proxyAppleAudio(audioUrl, null)).status, 502)
  const invalidRange = await proxyAppleAudio(audioUrl, 'bytes=1000-')
  assert.equal(invalidRange.status, 416)
  assert.equal(invalidRange.headers.get('content-range'), 'bytes */100')
  assert.equal((await proxyAppleAudio('https://example.com/audio.m4a', null)).status, 400)
})

test('malformed redirects and redirect loops stop with a controlled failure', async (t) => {
  const requests = stubUpstream(t, [
    { status: 302, headers: { location: 'https://[' } },
    ...Array.from({ length: 4 }, () => ({ status: 302, headers: { location: '/loop' } })),
  ])
  assert.equal((await proxyAppleAudio(audioUrl, null)).status, 502)
  assert.equal((await proxyAppleAudio(audioUrl, null)).status, 502)
  assert.equal(requests.length, 5)
})

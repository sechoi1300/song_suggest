import https from 'node:https'
import tls from 'node:tls'

// Include enterprise CAs trusted by the OS without disabling TLS verification.
const certificateStore = tls as typeof tls & {
  getCACertificates?: (type: 'default' | 'system') => string[]
}

export const appleHttpsAgent = new https.Agent({
  ca: certificateStore.getCACertificates
    ? [...certificateStore.getCACertificates('default'), ...certificateStore.getCACertificates('system')]
    : undefined,
})

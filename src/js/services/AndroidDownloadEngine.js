export class AndroidDownloadEngine {
  constructor() {
    this._abortController = null
    this._http = null
  }

  async _getHttp() {
    if (!this._http && window.Capacitor?.isNativePlatform?.()) {
      const mod = await import('@capacitor/core').catch(() => null)
      this._http = mod?.CapacitorHttp || null
    }
    return this._http
  }

  async download({ url, filename }, onProgress) {
    console.log('[Engine] Download start, url length:', url?.length, 'filename:', filename)
    this._abortController = new AbortController()
    const Filesystem = window.Capacitor?.Plugins?.Filesystem
    if (!Filesystem) throw new Error('Capacitor Filesystem not available')

    const subDir = 'downloads'
    const filePath = `${subDir}/${filename}`
    console.log('[Engine] File path:', filePath)

    await Filesystem.mkdir({ path: subDir, directory: 'DATA', recursive: true }).catch(() => {})
    await Filesystem.writeFile({
      path: filePath,
      data: '',
      directory: 'DATA',
    }).catch(async () => {
      await Filesystem.mkdir({ path: subDir, directory: 'DATA', recursive: true })
      await Filesystem.writeFile({
        path: filePath,
        data: '',
        directory: 'DATA',
      })
    })
    console.log('[Engine] Temp file created')

    let downloadedBytes = 0
    try {
      const http = await this._getHttp()
      console.log('[Engine] CapacitorHttp available:', !!http)
      if (http) {
        console.log('[Engine] Starting CapacitorHttp download')
        const timeout = setTimeout(() => { console.log('[Engine] Timeout reached, aborting'); this.abort() }, 60000)
        try {
          const res = await http.get({
            url,
            responseType: 'arraybuffer',
            readTimeout: 60000,
            connectTimeout: 15000,
          })
          console.log('[Engine] Download response status:', res.status)
          if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`)
          if (res.data) {
            downloadedBytes = Math.ceil(res.data.length * 3 / 4)
            console.log('[Engine] Writing', downloadedBytes, 'bytes')
            await Filesystem.appendFile({ path: filePath, data: res.data, directory: 'DATA', encoding: 'base64' })
            console.log('[Engine] Write complete')
            if (onProgress) onProgress({ loaded: downloadedBytes, total: downloadedBytes, percent: 100 })
          }
        } finally {
          clearTimeout(timeout)
        }
      } else {
        console.log('[Engine] Starting fetch() download')
        const timeout = setTimeout(() => { console.log('[Engine] Timeout reached, aborting'); this.abort() }, 60000)
        try {
          const resp = await fetch(url, { signal: this._abortController.signal })
          console.log('[Engine] Fetch response status:', resp.status)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const buf = await resp.arrayBuffer()
          downloadedBytes = buf.byteLength
          console.log('[Engine] Downloaded', downloadedBytes, 'bytes via fetch')
          const b64 = arrayBufferToBase64(buf)
          await Filesystem.appendFile({ path: filePath, data: b64, directory: 'DATA', encoding: 'base64' })
          console.log('[Engine] Write complete')
          if (onProgress) onProgress({ loaded: downloadedBytes, total: downloadedBytes, percent: 100 })
        } finally {
          clearTimeout(timeout)
        }
      }
    } catch (err) {
      console.error('[Engine] Download error:', err)
      if (downloadedBytes > 0) {
        await Filesystem.appendFile({ path: filePath, data: '', directory: 'DATA' }).catch(() => {})
      } else {
        await Filesystem.deleteFile({ path: filePath, directory: 'DATA' }).catch(() => {})
      }
      throw err
    }

    console.log('[Engine] Download complete, returning')
    return { path: filePath, bytes: downloadedBytes }
  }

  abort() {
    if (this._abortController) {
      this._abortController.abort()
      this._abortController = null
    }
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

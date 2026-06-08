import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class CardView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.loadVideoById = (id) => this.loadVideoById(id)
    window.addCurrentVideo = () => this.addCurrentVideo()
    window.unlinkCurrentVideo = () => this.unlinkCurrentVideo()
    window.updateCardAddBtn = () => this.updateCardAddBtn()
    window.updatePinBadge = (id) => this.updatePinBadge(id)
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('copyLinkBtn'), 'click', (e) => {
      e.stopPropagation()
      if (!window.currentVideo?.url) return
      navigator.clipboard.writeText(window.currentVideo.url).then(() => {
        const toast = document.getElementById('updateToast')
        if (toast) {
          toast.textContent = 'Copied to clipboard'
          toast.classList.add('show')
          setTimeout(() => toast.classList.remove('show'), 2000)
        }
      }).catch(() => {})
    })

    this.listenTo(document.getElementById('imageWrap'), 'click', () => {
      if (window.currentVideo?.url) window.open(window.currentVideo.url)
    })

    this.listenTo(document.getElementById('cardAddBtn'), 'click', () => this.addCurrentVideo())
    this.listenTo(document.getElementById('dlBtn'), 'click', (e) => this._handleDownload(e))
  }

  _handleDownload(e) {
    e.stopPropagation()
    if (!window.currentVideo?.url) return

    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    if (!isElectron) {
      const toast = document.getElementById('updateToast')
      if (toast) {
        const text = document.getElementById('updateToastText') || toast
        text.textContent = 'Desktop exclusive \u2014 use the desktop app'
        const actions = document.querySelector('.update-toast-actions')
        if (actions) actions.style.display = 'none'
        toast.classList.add('show')
        setTimeout(() => { toast.classList.remove('show'); if (actions) actions.style.display = '' }, 3000)
      }
      return
    }

    this._startDownload()
  }

  async _startDownload() {
    const prefs = {
      type: localStorage.getItem('dlType') || 'video',
      videoQuality: localStorage.getItem('dlVideoQuality') || '720',
      audioFormat: localStorage.getItem('dlAudioFormat') || 'mp3',
      audioBitrate: localStorage.getItem('dlAudioBitrate') || 'auto',
      videoCodec: localStorage.getItem('dlVideoCodec') || 'h264'
    }

    const toast = document.getElementById('updateToast')
    const toastText = document.getElementById('updateToastText') || toast
    const progress = document.getElementById('dlProgress')
    const fill = document.getElementById('dlProgressFill')
    const pctText = document.getElementById('dlProgressText')
    const actions = document.querySelector('.update-toast-actions')

    progress.style.display = 'flex'
    fill.style.width = '0%'
    pctText.textContent = '0%'

    let folder
    try {
      folder = await window.require('electron').ipcRenderer.invoke('pick-folder')
    } catch {}
    if (!folder) {
      progress.style.display = 'none'
      return
    }

    const quality = parseInt(prefs.videoQuality)
    const wantsSeparate = prefs.videoQuality === 'max' || isNaN(quality) || (!isNaN(quality) && quality >= 1080)
    const needsFfmpeg = prefs.type === 'audio' || (prefs.type === 'video' && wantsSeparate)
    let hasFfmpeg = await new Promise(r => {
      const p = window.require('child_process').spawn('ffmpeg', ['-version'])
      let done = false
      p.on('error', () => { if (!done) { done = true; r(false) } })
      p.on('close', code => { if (!done) { done = true; r(code === 0) } })
      setTimeout(() => { if (!done) { done = true; r(false) } }, 3000)
    })

    const ytDlpDir = window.require('path').join(window.require('os').homedir(), '.kiro', 'bin')
    const ffmpegPath = window.require('path').join(ytDlpDir, 'ffmpeg.exe')
    if (!hasFfmpeg) hasFfmpeg = window.require('fs').existsSync(ffmpegPath)

    if (needsFfmpeg && !hasFfmpeg) {
      try {
        await this._ensureFfmpeg()
        hasFfmpeg = true
      } catch {
        if (prefs.type === 'audio') {
          toastText.textContent = 'ffmpeg required for audio download \u2014 install ffmpeg or try video mode'
          progress.style.display = 'none'
          return
        }
        toastText.textContent = 'ffmpeg download failed \u2014 limited to 720p'
      }
    }

    this._ensureYtDlp().then((ytPath) => {
      const args = ['--no-playlist', '--progress', '-o', window.require('path').join(folder, '%(title)s.%(ext)s')]
      if (prefs.type === 'audio') {
        args.push('-x', '--audio-format', prefs.audioFormat)
        if (prefs.audioBitrate !== 'auto') args.push('--audio-quality', prefs.audioBitrate + 'k')
      } else {
        let format
        if (prefs.videoQuality === 'max') {
          format = hasFfmpeg ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' : 'best[ext=mp4]/best'
        } else if (wantsSeparate && hasFfmpeg) {
          format = `bestvideo[height<=${prefs.videoQuality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${prefs.videoQuality}][ext=mp4]/best[height<=${prefs.videoQuality}]`
        } else {
          format = `best[height<=${prefs.videoQuality}][ext=mp4]/best[height<=${prefs.videoQuality}]/best[height<=720]/best`
        }
        args.push('-f', format)
        if (prefs.videoCodec !== 'h264') args.push('--video-multistreams', '--prefer-free-formats')
      }
      args.push(window.currentVideo.url)

      if (actions) actions.style.display = 'none'
      toastText.textContent = 'Starting download\u2026'
      toast.classList.add('show')

      const proc = window.require('child_process').spawn(ytPath, args)
      let output = ''
      const onOutput = (data) => {
        const text = data.toString()
        output += text
        if (text.includes('[Merger]')) {
          toastText.textContent = 'Merging\u2026'
        }
        const m = text.match(/(\d+\.?\d*)%\s/)
        if (m) {
          const pct = parseFloat(m[1])
          fill.style.width = pct + '%'
          pctText.textContent = pct.toFixed(0) + '%'
          toastText.textContent = `Downloading\u2026 ${pct.toFixed(0)}%`
        }
      }
      proc.stdout.on('data', onOutput)
      proc.stderr.on('data', onOutput)
      proc.on('close', (code) => {
        if (code === 0) {
          fill.style.width = '100%'
          pctText.textContent = '100%'
          toastText.textContent = 'Download complete'
          if (actions) actions.style.display = 'none'
          toast.classList.add('show')
          setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show'); if (actions) actions.style.display = '' }, 4000)
          window.require('child_process').exec(`explorer "${folder.replace(/"/g, '""')}"`)
        } else {
          const errLines = output.split('\n').filter(Boolean).slice(-8).join('\n')
          toastText.textContent = errLines ? errLines : `Download failed (code ${code})`
          setTimeout(() => { toast.classList.remove('show'); if (actions) actions.style.display = '' }, 12000)
        }
      })
      proc.on('error', (err) => {
        toastText.textContent = 'Failed to start download: ' + (err.message || '')
        setTimeout(() => { toast.classList.remove('show'); if (actions) actions.style.display = '' }, 5000)
      })
    }).catch((err) => {
      toastText.textContent = 'Download setup failed: ' + (err.message || '')
      progress.style.display = 'none'
      setTimeout(() => { toast.classList.remove('show'); if (actions) actions.style.display = '' }, 5000)
    })
  }

  _ensureYtDlp() {
    const ytDlpDir = window.require('path').join(window.require('os').homedir(), '.kiro', 'bin')
    const ytDlpPath = window.require('path').join(ytDlpDir, 'yt-dlp.exe')
    const ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'

    if (window.require('fs').existsSync(ytDlpPath)) return Promise.resolve(ytDlpPath)

    const toast = document.getElementById('updateToast')
    const toastText = document.getElementById('updateToastText') || toast
    const progress = document.getElementById('dlProgress')
    const fill = document.getElementById('dlProgressFill')
    const pctText = document.getElementById('dlProgressText')
    const actions = document.querySelector('.update-toast-actions')

    progress.style.display = 'flex'
    fill.style.width = '0%'
    pctText.textContent = '0%'
    toastText.textContent = 'Downloading yt-dlp\u2026'
    if (actions) actions.style.display = 'none'
    toast.classList.add('show')

    try { window.require('fs').mkdirSync(ytDlpDir, { recursive: true }) } catch {}

    return this._dlFile(ytDlpUrl, ytDlpPath).then(() => {
      fill.style.width = '100%'
      pctText.textContent = '100%'
      toastText.textContent = 'yt-dlp ready'
      setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show'); if (actions) actions.style.display = '' }, 1500)
      return ytDlpPath
    }).catch((e) => {
      if (actions) actions.style.display = ''
      throw e
    })
  }

  _ensureFfmpeg() {
    const ytDlpDir = window.require('path').join(window.require('os').homedir(), '.kiro', 'bin')
    const ffmpegPath = window.require('path').join(ytDlpDir, 'ffmpeg.exe')
    const ffmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'

    if (window.require('fs').existsSync(ffmpegPath)) return Promise.resolve(ffmpegPath)

    const toast = document.getElementById('updateToast')
    const toastText = document.getElementById('updateToastText') || toast
    const progress = document.getElementById('dlProgress')
    const fill = document.getElementById('dlProgressFill')
    const pctText = document.getElementById('dlProgressText')
    const actions = document.querySelector('.update-toast-actions')

    progress.style.display = 'flex'
    fill.style.width = '0%'
    pctText.textContent = '0%'
    toastText.textContent = 'Downloading ffmpeg\u2026'
    if (actions) actions.style.display = 'none'
    toast.classList.add('show')

    try { window.require('fs').mkdirSync(ytDlpDir, { recursive: true }) } catch {}
    const zipPath = window.require('path').join(ytDlpDir, 'ffmpeg.zip')

    return this._dlFile(ffmpegUrl, zipPath).then(() => {
      fill.style.width = '50%'
      pctText.textContent = '50%'
      toastText.textContent = 'Extracting ffmpeg\u2026'

      const extractDir = window.require('path').join(ytDlpDir, 'ffmpeg-temp')
      return new Promise((resolve, reject) => {
        window.require('child_process').exec(
          `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force; $exe = Get-ChildItem -Path '${extractDir.replace(/'/g, "''")}' -Recurse -Filter ffmpeg.exe | Select-Object -First 1 -ExpandProperty FullName; if ($exe) { Move-Item -Path $exe -Destination '${ffmpegPath.replace(/'/g, "''")}' -Force; Write-Output 'ok' }`,
          (err, stdout) => {
            if (!err && stdout.trim() === 'ok' && window.require('fs').existsSync(ffmpegPath)) {
              fill.style.width = '100%'
              pctText.textContent = '100%'
              toastText.textContent = 'ffmpeg ready'
              setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show'); if (actions) actions.style.display = '' }, 1500)
              resolve(ffmpegPath)
            } else {
              reject(new Error('Failed to extract ffmpeg'))
            }
            try { window.require('fs').rmSync(zipPath, { force: true }); window.require('fs').rmSync(extractDir, { recursive: true, force: true }) } catch {}
          }
        )
      })
    }).catch((e) => {
      if (actions) actions.style.display = ''
      throw e
    })
  }

  _dlFile(url, dest) {
    return new Promise((resolve, reject) => {
      const proto = url.startsWith('https') ? window.require('https') : window.require('http')
      proto.get(url, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this._dlFile(res.headers.location, dest).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const file = window.require('fs').createWriteStream(dest)
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve(dest) })
        file.on('error', reject)
      }).on('error', reject)
    })
  }

  async loadVideoById(id) {
    const v = (window.getVideos?.() || {})[id]
    if (!v) return
    window.currentVideo = { ...v, id }

    const thumb = document.getElementById('thumbnail')
    if (thumb) thumb.src = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
    const dur = document.getElementById('durationBadge')
    if (dur) dur.textContent = v.duration || '–'
    const title = document.getElementById('videoTitle')
    if (title) title.textContent = v.title
    const channel = document.getElementById('channelName')
    if (channel) channel.textContent = v.channel

    if (!v.pubDate) {
      fetch(`https://pipedapi.kavin.rocks/streams/${id}`)
        .then(res => res.json())
        .then(piped => {
          if (piped.uploadDate) {
            const d = new Date(piped.uploadDate)
            const vs = window.getVideos?.() || {}
            if (vs[id]) { vs[id].pubDate = d.toISOString(); window.saveVideos?.(vs) }
          }
        }).catch(() => {})
    }
    if (window.currentNoteId && window.closeNoteView) window.closeNoteView()
    this.updatePinBadge(id)
    if (window.showCardView) window.showCardView()
    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()

    this.bus.emit('ui:card:loaded', { id, video: v })
  }

  updatePinBadge(id) {
    const wrap = document.getElementById('imageWrap')
    if (!wrap) return
    const old = wrap.querySelector('.pin-badge')
    if (old) old.remove()
    if ((window.getPins?.() || []).includes(id)) {
      const badge = document.createElement('div')
      badge.className = 'pin-badge'
      badge.innerHTML = '<i data-lucide="pin-off" style="width:14px;height:14px"></i>'
      wrap.appendChild(badge)
      if (window.loadIcons) window.loadIcons()
    }
  }

  updateCardAddBtn() {
    const row = document.getElementById('cardAddRow')
    const btn = document.getElementById('cardAddBtn')
    const copyBtn = document.getElementById('copyLinkBtn')
    const dlBtn = document.getElementById('dlBtn')
    if (!window.currentVideo) {
      if (row) row.style.display = 'none'
      if (dlBtn) dlBtn.style.display = 'none'
      return
    }
    const vs = window.getVideos?.() || {}
    if (vs[window.currentVideo.id]) {
      if (row) row.style.display = 'flex'
      if (btn) {
        btn.classList.add('saved')
        btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
        btn.onmouseover = () => {
          btn.innerHTML = '<i data-lucide="trash-2" class="card-add-icon"></i> Unlink'
          if (window.loadIcons) window.loadIcons()
        }
        btn.onmouseout = () => {
          btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
          if (window.loadIcons) window.loadIcons()
        }
        btn.onclick = (e) => { e.stopPropagation(); if (window.currentVideo) this.unlinkCurrentVideo() }
      }
      if (copyBtn) copyBtn.style.display = 'inline-flex'
      if (dlBtn) {
        dlBtn.style.display = 'inline-flex'
        const isElectron = typeof process !== 'undefined' && process.versions?.electron
        dlBtn.classList.toggle('desktop-only', !isElectron)
        dlBtn.innerHTML = '<i data-lucide="download" class="card-add-icon"></i> ' + (isElectron ? 'Download' : 'Desktop exclusive')
      }
      if (window.loadIcons) window.loadIcons()
    } else {
      if (row) row.style.display = 'flex'
      if (btn) {
        btn.classList.remove('saved')
        btn.innerHTML = '<i data-lucide="plus" class="card-add-icon"></i> Add video'
        btn.onmouseover = btn.onmouseout = btn.onclick = null
      }
      if (copyBtn) copyBtn.style.display = 'none'
      if (dlBtn) dlBtn.style.display = 'none'
      if (window.loadIcons) window.loadIcons()
    }
  }

  addCurrentVideo() {
    if (!window.currentVideo) {
      const title = document.getElementById('videoTitle')
      if (title) title.textContent = 'Load a video first'
      return
    }
    const { id, title, channel, duration, pubDate, privacy, url } = window.currentVideo
    const vs = window.getVideos?.() || {}
    if (vs[id]) return
    vs[id] = {
      title, channel, duration,
      pubDate: pubDate?.toISOString?.(),
      privacy: privacy || 'PUBLIC',
      url: url || '',
      thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      added: Date.now()
    }
    window.saveVideos?.(vs)

    const fs = window.getFolders?.() || {}
    if (!fs['Videos']) fs['Videos'] = []
    if (!fs['Videos'].includes(id)) fs['Videos'].push(id)
    window.saveFolders?.(fs)

    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()
    if (window.closeSidebar) window.closeSidebar()

    const historyToggle = document.querySelector('#pane-history .settings-toggle:first-child')
    if (historyToggle?.classList.contains('on')) {
      const h = (window.loadHistory?.() || []).filter(x => x.id !== id)
      h.unshift({ id, title, channel })
      if (window.saveHistory) window.saveHistory(h)
    }

    if (document.getElementById('searchLanding')?.style.display === 'flex') {
      if (window.renderSearchLanding) window.renderSearchLanding()
    }

    this.bus.emit('ui:video:added', { id, video: vs[id] })
  }

  unlinkCurrentVideo() {
    if (!window.currentVideo) return
    const id = window.currentVideo.id
    const vs = window.getVideos?.() || {}
    if (!vs[id]) return
    delete vs[id]
    window.saveVideos?.(vs)

    const fs = window.getFolders?.() || {}
    for (const ids of Object.values(fs)) {
      const i = ids.indexOf(id)
      if (i > -1) ids.splice(i, 1)
    }
    window.saveFolders?.(fs)

    const pins = window.getPins?.() || []
    const pi = pins.indexOf(id)
    if (pi > -1) { pins.splice(pi, 1); window.savePins?.(pins) }

    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()
  }
}

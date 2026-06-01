// ─── Load video ───────────────────────────────────────
async function loadVideoById(id) {
  const v = getVideos()[id]; if (!v) return
  currentVideo = { ...v, id }
  document.getElementById('thumbnail').src = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  document.getElementById('durationBadge').textContent = v.duration || '–'
  document.getElementById('videoTitle').textContent = v.title
  document.getElementById('channelName').textContent = v.channel
  if (!v.pubDate) {
    try {
      const piped = await (await fetch(`https://pipedapi.kavin.rocks/streams/${id}`)).json()
      if (piped.uploadDate) {
        const d = new Date(piped.uploadDate)
        const vs = getVideos()
        if (vs[id]) { vs[id].pubDate = d.toISOString(); saveVideos(vs) }
      }
    } catch (_) {}
  }
  if (currentNoteId) closeNoteView()
  updatePinBadge(id); showCardView(); renderSidebar(); updateCardAddBtn()
}

function updatePinBadge(id) {
  const wrap = document.getElementById('imageWrap')
  const old = wrap.querySelector('.pin-badge')
  if (old) old.remove()
  if (getPins().includes(id)) {
    const badge = document.createElement('div')
    badge.className = 'pin-badge'
    badge.innerHTML = '<i data-lucide="pin-off" style="width:14px;height:14px"></i>'
    wrap.appendChild(badge)
    loadIcons()
  }
}

function updateCardAddBtn() {
  const row = document.getElementById('cardAddRow')
  const btn = document.getElementById('cardAddBtn')
  const copyBtn = document.getElementById('copyLinkBtn')
  const dlBtn = document.getElementById('dlBtn')
  if (!currentVideo) { row.style.display = 'none'; if (dlBtn) dlBtn.style.display = 'none'; return }
  const vs = getVideos()
  if (vs[currentVideo.id]) {
    row.style.display = 'flex'
    btn.classList.add('saved')
    btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
    btn.onmouseover = () => {
      btn.innerHTML = '<i data-lucide="trash-2" class="card-add-icon"></i> Unlink'
      loadIcons()
    }
    btn.onmouseout = () => {
      btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
      loadIcons()
    }
    btn.onclick = (e) => { e.stopPropagation(); if (currentVideo) unlinkCurrentVideo() }
    copyBtn.style.display = 'inline-flex'
    if (dlBtn) {
      dlBtn.style.display = 'inline-flex'
      dlBtn.classList.toggle('desktop-only', !isElectron)
      dlBtn.innerHTML = '<i data-lucide="download" class="card-add-icon"></i> ' + (isElectron ? 'Download' : 'Desktop exclusive')
    }
    loadIcons()
  } else {
    row.style.display = 'flex'
    btn.classList.remove('saved')
    btn.innerHTML = '<i data-lucide="plus" class="card-add-icon"></i> Add video'
    btn.onmouseover = btn.onmouseout = btn.onclick = null
    copyBtn.style.display = 'none'
    if (dlBtn) dlBtn.style.display = 'none'
    loadIcons()
  }
}

function addCurrentVideo() {
  if (!currentVideo) { document.getElementById('videoTitle').textContent = 'Load a video first'; return }
  const { id, title, channel, duration, pubDate, privacy, url } = currentVideo
  const vs = getVideos()
  if (vs[id]) return
  vs[id] = { title, channel, duration, pubDate: pubDate?.toISOString(), privacy: privacy || 'PUBLIC', url: url || '', thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, added: Date.now() }
  saveVideos(vs)
  const fs = getFolders()
  if (!fs['Videos']) fs['Videos'] = []
  if (!fs['Videos'].includes(id)) fs['Videos'].push(id)
  saveFolders(fs)
  renderSidebar(); updateCardAddBtn(); closeSidebarMobile()
  const t = document.querySelector('#pane-history .settings-toggle:first-child')
  if (t?.classList.contains('on')) { const h = loadHistory().filter(x => x.id !== id); h.unshift({ id, title, channel }); saveHistory(h) }
  if (document.getElementById('searchLanding').style.display === 'flex') renderSearchLanding()
}

function unlinkCurrentVideo() {
  if (!currentVideo) return
  const id = currentVideo.id
  const vs = getVideos()
  if (!vs[id]) return
  delete vs[id]; saveVideos(vs)
  const fs = getFolders()
  for (const ids of Object.values(fs)) { const i = ids.indexOf(id); if (i > -1) ids.splice(i, 1) }
  saveFolders(fs)
  const pins = getPins(); const pi = pins.indexOf(id); if (pi > -1) { pins.splice(pi, 1); savePins(pins) }
  renderSidebar(); updateCardAddBtn()
}

// ─── Event listeners ──────────────────────────────────
document.getElementById('copyLinkBtn').addEventListener('click', (e) => {
  e.stopPropagation()
  if (!currentVideo?.url) return
  navigator.clipboard.writeText(currentVideo.url).then(() => {
    const toast = document.getElementById('updateToast')
    toast.textContent = 'Copied to clipboard'
    toast.classList.add('show')
    setTimeout(() => toast.classList.remove('show'), 2000)
  }).catch(() => {})
})

document.getElementById('imageWrap').addEventListener('click', () => {
  if (currentVideo?.url) window.open(currentVideo.url)
})

document.getElementById('cardAddBtn').addEventListener('click', addCurrentVideo)

// ─── Download ──────────────────────────────────
const isElectron = typeof process !== 'undefined' && process.versions?.electron

function hideToastActions() {
  const actions = document.querySelector('.update-toast-actions')
  if (actions) actions.style.display = 'none'
}
function showToastActions() {
  const actions = document.querySelector('.update-toast-actions')
  if (actions) actions.style.display = ''
}
const ytDlpDir = isElectron ? require('path').join(require('os').homedir(), '.youtube-vault', 'bin') : ''
const ytDlpPath = isElectron ? require('path').join(ytDlpDir, 'yt-dlp.exe') : ''
const ytDlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
const ffmpegUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip'
const ffmpegPath = isElectron ? require('path').join(ytDlpDir, 'ffmpeg.exe') : ''

function getDownloadPrefs() {
  return {
    type: localStorage.getItem('dlType') || 'video',
    videoQuality: localStorage.getItem('dlVideoQuality') || '720',
    audioFormat: localStorage.getItem('dlAudioFormat') || 'mp3',
    audioBitrate: localStorage.getItem('dlAudioBitrate') || 'auto',
    videoCodec: localStorage.getItem('dlVideoCodec') || 'h264'
  }
}

function dl(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? require('https') : require('http')
    proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        dl(res.headers.location, dest).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const file = require('fs').createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve(dest) })
      file.on('error', reject)
    }).on('error', reject)
  })
}

function ensureYtDlp() {
  if (!isElectron) return Promise.reject(new Error('Not Electron'))
  if (require('fs').existsSync(ytDlpPath)) return Promise.resolve(ytDlpPath)
  const toast = document.getElementById('updateToast')
  const toastText = document.getElementById('updateToastText') || toast
  const progress = document.getElementById('dlProgress')
  const fill = document.getElementById('dlProgressFill')
  const pctText = document.getElementById('dlProgressText')
  progress.style.display = 'flex'
  fill.style.width = '0%'
  pctText.textContent = '0%'
  toastText.textContent = 'Downloading yt-dlp\u2026'
  hideToastActions()
  toast.classList.add('show')
  try { require('fs').mkdirSync(ytDlpDir, { recursive: true }) } catch {}
  return dl(ytDlpUrl, ytDlpPath).then(() => {
    fill.style.width = '100%'
    pctText.textContent = '100%'
    toastText.textContent = 'yt-dlp ready'
    setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show'); showToastActions() }, 1500)
    return ytDlpPath
  }).catch((e) => {
    showToastActions()
    throw e
  })
}

function ensureFfmpeg() {
  if (!isElectron) return Promise.reject(new Error('Not Electron'))
  if (require('fs').existsSync(ffmpegPath)) return Promise.resolve(ffmpegPath)
  const toast = document.getElementById('updateToast')
  const toastText = document.getElementById('updateToastText') || toast
  const progress = document.getElementById('dlProgress')
  const fill = document.getElementById('dlProgressFill')
  const pctText = document.getElementById('dlProgressText')
  progress.style.display = 'flex'
  fill.style.width = '0%'
  pctText.textContent = '0%'
  toastText.textContent = 'Downloading ffmpeg\u2026'
  hideToastActions()
  toast.classList.add('show')
  try { require('fs').mkdirSync(ytDlpDir, { recursive: true }) } catch {}
  const zipPath = require('path').join(ytDlpDir, 'ffmpeg.zip')
  return dl(ffmpegUrl, zipPath).then(() => {
    fill.style.width = '50%'
    pctText.textContent = '50%'
    toastText.textContent = 'Extracting ffmpeg\u2026'
    const extractDir = require('path').join(ytDlpDir, 'ffmpeg-temp')
    return new Promise((resolve, reject) => {
      require('child_process').exec(
        `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force; $exe = Get-ChildItem -Path '${extractDir.replace(/'/g, "''")}' -Recurse -Filter ffmpeg.exe | Select-Object -First 1 -ExpandProperty FullName; if ($exe) { Move-Item -Path $exe -Destination '${ffmpegPath.replace(/'/g, "''")}' -Force; Write-Output 'ok' }`,
        (err, stdout) => {
          if (!err && stdout.trim() === 'ok' && require('fs').existsSync(ffmpegPath)) {
            fill.style.width = '100%'
            pctText.textContent = '100%'
            toastText.textContent = 'ffmpeg ready'
            setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show') }, 1500)
            resolve(ffmpegPath)
          } else {
              reject(new Error('Failed to extract ffmpeg'))
          }
          try { require('fs').rmSync(zipPath, { force: true }); require('fs').rmSync(extractDir, { recursive: true, force: true }) } catch {}
        }
      )
    })
  }).catch((e) => {
    showToastActions()
    throw e
  })
}

document.getElementById('dlBtn')?.addEventListener('click', async (e) => {
  e.stopPropagation()
  if (!currentVideo?.url) return
  if (!isElectron) {
    const toast = document.getElementById('updateToast')
    const toastText = document.getElementById('updateToastText') || toast
    toastText.textContent = 'Desktop exclusive \u2014 use the desktop app'
    hideToastActions()
    toast.classList.add('show')
    setTimeout(() => { toast.classList.remove('show'); showToastActions() }, 3000)
    return
  }
  const prefs = getDownloadPrefs()
  const toast = document.getElementById('updateToast')
  const toastText = document.getElementById('updateToastText') || toast
  const progress = document.getElementById('dlProgress')
  const fill = document.getElementById('dlProgressFill')
  const pctText = document.getElementById('dlProgressText')
  progress.style.display = 'flex'
  fill.style.width = '0%'
  pctText.textContent = '0%'
  let folder
  try {
    folder = await require('electron').ipcRenderer.invoke('pick-folder')
  } catch {}
  if (!folder) {
    progress.style.display = 'none'
    return
  }
  const quality = parseInt(prefs.videoQuality)
  const needsFfmpeg = prefs.type === 'video' && (isNaN(quality) || quality >= 1080)
  let hasFfmpeg = await new Promise(r => {
    const p = require('child_process').spawn('ffmpeg', ['-version'])
    let done = false
    p.on('error', () => { if (!done) { done = true; r(false) } })
    p.on('close', code => { if (!done) { done = true; r(code === 0) } })
    setTimeout(() => { if (!done) { done = true; r(false) } }, 3000)
  })
  if (!hasFfmpeg) hasFfmpeg = require('fs').existsSync(ffmpegPath)
  if (needsFfmpeg && !hasFfmpeg) {
    try {
      await ensureFfmpeg()
      hasFfmpeg = true
    } catch {
      toastText.textContent = 'ffmpeg download failed \u2014 limited to 720p'
    }
  }
  ensureYtDlp().then((ytPath) => {
    let args = ['--no-playlist', '--progress', '-o', require('path').join(folder, '%(title)s.%(ext)s')]
    if (prefs.type === 'audio') {
      args.push('-x', '--audio-format', prefs.audioFormat)
      if (prefs.audioBitrate !== 'auto') args.push('--audio-quality', prefs.audioBitrate + 'k')
    } else {
      let format
      if (prefs.videoQuality === 'max') {
        format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
      } else if (hasFfmpeg) {
        format = `bestvideo[height<=${prefs.videoQuality}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${prefs.videoQuality}][ext=mp4]/best[height<=${prefs.videoQuality}]`
      } else {
        format = `best[height<=${prefs.videoQuality}][ext=mp4]/best[height<=${prefs.videoQuality}]`
      }
      args.push('-f', format)
      if (prefs.videoCodec !== 'h264') args.push('--video-multistreams', '--prefer-free-formats')
    }
    args.push(currentVideo.url)
    hideToastActions()
    toastText.textContent = 'Starting download\u2026'
    toast.classList.add('show')
    const proc = require('child_process').spawn(ytPath, args)
    let output = ''
    function onOutput(data) {
      const text = data.toString()
      output += text
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
        hideToastActions()
        toast.classList.add('show')
        setTimeout(() => { progress.style.display = 'none'; toast.classList.remove('show'); showToastActions() }, 4000)
        const destMatch = output.match(/\[download\]\s+Destination:\s+(.+)/i)
        const dest = destMatch ? destMatch[1].trim() : folder
        if (dest) {
          require('child_process').exec(`explorer /select,"${dest.replace(/"/g, '""')}"`)
        }
      } else {
        const lines = output.split('\n').filter(Boolean).slice(-6).join('\n')
        toastText.textContent = lines || `yt-dlp exited with code ${code}`
        setTimeout(() => { toast.classList.remove('show'); showToastActions() }, 12000)
      }
    })
    proc.on('error', (err) => {
      toastText.textContent = 'Failed to start yt-dlp: ' + (err.message || '')
      setTimeout(() => { toast.classList.remove('show'); showToastActions() }, 5000)
    })
  }).catch((err) => {
    toastText.textContent = 'Failed to download yt-dlp: ' + (err.message || '')
    progress.style.display = 'none'
    setTimeout(() => { toast.classList.remove('show'); showToastActions() }, 5000)
  })
})

// ─── Data module ────────────────────────────────────────
// Provides localStorage CRUD + window.* globals for backward compat

const NSFW_DEFAULTS = ['pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com', 'xhamster.com', 'stripchat.com', 'chaturbate.com', 'onlyfans.com']
let selectedGridItems = new Set()
let currentVideo = null
let dragVideoId = null
let currentNoteId = null

const APP_VERSION = '3.1.1'

const STORAGE_GROUPS = {
  videos: ['kiroVideos','kiroFolders','kiroFolderMeta','kiroPins'],
  notes: ['kiroNotes'],
  bookmarks: ['kiroBookmarks'],
  direct: ['kiroDirectAccess'],
  externalFiles: ['kiro_external_files'],
  other: ['kiroNSFW','kiroCollapsed','kiroSettings','kiroUserName','linkHistory','kiroPages']
}

function migrateStorage() {
  if (localStorage.getItem('kiro_migrated')) return
  var map = [
    ['ytVideos', 'kiroVideos'],
    ['ytFolders', 'kiroFolders'],
    ['ytFolderMeta', 'kiroFolderMeta'],
    ['ytPins', 'kiroPins'],
    ['ytBookmarks', 'kiroBookmarks'],
    ['ytDirectAccess', 'kiroDirectAccess'],
    ['ytNSFW', 'kiroNSFW'],
    ['ytBlurAllNSFW', 'kiroBlurAllNSFW'],
    ['ytNotes', 'kiroNotes'],
    ['ytCollapsed', 'kiroCollapsed'],
    ['ytUserName', 'kiroUserName'],
    ['ytSettings', 'kiroSettings'],
    ['ytLastVersion', 'kiroLastVersion'],
  ]
  for (var i = 0; i < map.length; i++) {
    var old = localStorage.getItem(map[i][0])
    if (old !== null) {
      localStorage.setItem(map[i][1], old)
      localStorage.removeItem(map[i][0])
    }
  }
  localStorage.setItem('kiro_migrated', 'true')
}
migrateStorage()

function safeSetItem(key, val) {
  try { localStorage.setItem(key, val) }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      const t = document.getElementById('updateToast')
      if (t) { t.textContent = 'Storage full — clear some data'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000) }
    }
  }
}

function getVideos() { try { return JSON.parse(localStorage.getItem('kiroVideos') || '{}') } catch { return {} } }
function saveVideos(v) { safeSetItem('kiroVideos', JSON.stringify(v)) }

function getFolders() { try { return JSON.parse(localStorage.getItem('kiroFolders') || '{"Videos":[],"Archived":[]}') } catch { return { Videos: [], Archived: [] } } }
function saveFolders(f) { safeSetItem('kiroFolders', JSON.stringify(f)) }

function getFolderMeta() { try { return JSON.parse(localStorage.getItem('kiroFolderMeta') || '{}') } catch { return {} } }
function saveFolderMeta(m) { safeSetItem('kiroFolderMeta', JSON.stringify(m)) }

function getPins() { try { return JSON.parse(localStorage.getItem('kiroPins') || '[]') } catch { return [] } }
function savePins(p) { safeSetItem('kiroPins', JSON.stringify(p)) }

function getBookmarks() { try { return JSON.parse(localStorage.getItem('kiroBookmarks') || '[]') } catch { return [] } }
function saveBookmarks(b) { safeSetItem('kiroBookmarks', JSON.stringify(b)) }

function getDirectAccess() { try { return JSON.parse(localStorage.getItem('kiroDirectAccess') || '[]') } catch { return [] } }
function saveDirectAccess(d) { safeSetItem('kiroDirectAccess', JSON.stringify(d)) }

function getNSFW() { try { var v = localStorage.getItem('kiroNSFW'); if (v === null) { safeSetItem('kiroNSFW', JSON.stringify(NSFW_DEFAULTS)); return NSFW_DEFAULTS.slice() }; return JSON.parse(v) } catch { return [] } }
function saveNSFW(n) { safeSetItem('kiroNSFW', JSON.stringify(n)) }

function getBlurAllNSFW() { return localStorage.getItem('kiroBlurAllNSFW') === 'true' }
function saveBlurAllNSFW(v) { safeSetItem('kiroBlurAllNSFW', v ? 'true' : 'false') }

function isNSFW(item) {
  try {
    if (!getBlurAllNSFW()) return false
    const words = getNSFW().filter(Boolean)
    if (!words.length) return false
    const url = item?.url || ''
    const title = item?.title || ''
    const channel = item?.channel || ''
    const text = (url + ' ' + title + ' ' + channel).toLowerCase()
    if (words.some(n => text.includes(n))) return true
    if (url) {
      let fullUrl = url
      if (!/^https?:\/\//i.test(url)) fullUrl = 'https://' + url.replace(/^\/+/, '')
      try {
        const domain = new URL(fullUrl).hostname.replace(/^www\./, '').toLowerCase()
        if (words.some(n => domain === n || domain.endsWith('.' + n) || domain.startsWith(n + '.'))) return true
      } catch {}
    }
    return false
  } catch { return false }
}

function autoApplyNSFW() {
  if (!getBlurAllNSFW()) return
  if (!getNSFW().filter(Boolean).length) return
  var changed = false
  var vs = getVideos()
  for (var id in vs) {
    if (!vs[id].blurred && isNSFW(vs[id])) { vs[id].blurred = true; changed = true }
  }
  if (changed) saveVideos(vs)
  changed = false
  var bms = getBookmarks()
  for (var i = 0; i < bms.length; i++) {
    if (!bms[i].blurred && isNSFW(bms[i])) { bms[i].blurred = true; changed = true }
  }
  if (changed) saveBookmarks(bms)
  changed = false
  var das = getDirectAccess()
  for (var i = 0; i < das.length; i++) {
    if (!das[i].blurred && isNSFW(das[i])) { das[i].blurred = true; changed = true }
  }
  if (changed) saveDirectAccess(das)
}

function updateBatchBar() {
  const bar = document.getElementById('batchBar')
  const count = document.getElementById('batchCount')
  const len = selectedGridItems.size
  if (len) { bar.style.display = 'flex'; count.textContent = len + ' selected' }
  else { bar.style.display = 'none' }
}

function getNotes() { try { return JSON.parse(localStorage.getItem('kiroNotes') || '[]') } catch { return [] } }
function saveNotes(n) { safeSetItem('kiroNotes', JSON.stringify(n)) }

function stripHtml(str) { return str.replace(/<[^>]*>/g, '') }

function getCollapsed() { try { return JSON.parse(localStorage.getItem('kiroCollapsed') || '{}') } catch { return {} } }
function saveCollapsed(c) { safeSetItem('kiroCollapsed', JSON.stringify(c)) }

function sanitizeHtml(str) {
  const allowed = /^(b|i|u|em|strong|a|br|p|ul|ol|li|span|div|h[1-6]|pre|code|blockquote|img|input)$/i
  str = str.replace(/<script[\s\S]*?<\/script>/gi, '')
  str = str.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  str = str.replace(/\shref\s*=\s*["']javascript:[^"']*["']/gi, '')
  str = str.replace(/<[^>]*>/g, function(m) {
    const inner = m.slice(1, -1).trim()
    if (inner.startsWith('/')) {
      const tag = inner.slice(1).split(/\s/)[0]
      return allowed.test(tag) ? m : ''
    }
    const tag = inner.split(/\s/)[0]
    if (!allowed.test(tag)) return ''
    return m
  })
  return str
}

function getUserName() { return localStorage.getItem('kiroUserName') || '' }
function saveUserName(name) { localStorage.setItem('kiroUserName', name) }

function getExternalFiles() { try { return JSON.parse(localStorage.getItem('kiro_external_files') || '[]') } catch { return [] } }
function saveExternalFiles(f) { safeSetItem('kiro_external_files', JSON.stringify(f)) }

function getInstalledAt() { return localStorage.getItem('kiroInstalledAt') || null }
function getLastOpenedAt() { return localStorage.getItem('kiroLastOpenedAt') || null }
function updateAppDates() {
  if (!localStorage.getItem('kiroInstalledAt')) localStorage.setItem('kiroInstalledAt', new Date().toISOString())
  localStorage.setItem('kiroLastOpenedAt', new Date().toISOString())
}
updateAppDates()

function getStorageSize(key) {
  try {
    var v = localStorage.getItem(key)
    return v ? new Blob([v]).size : 0
  } catch { return 0 }
}

function getStorageBreakdown() {
  var groups = {}
  var total = 0
  for (var key in STORAGE_GROUPS) {
    var sum = 0
    for (var i = 0; i < STORAGE_GROUPS[key].length; i++) sum += getStorageSize(STORAGE_GROUPS[key][i])
    groups[key] = sum
    total += sum
  }
  groups.total = total
  return groups
}

function getVideoCount() { return Object.keys(getVideos()).length }
function getNoteCount() { return getNotes().length }
function getBookmarkCount() { return getBookmarks().length }

function getPages() { try { return JSON.parse(localStorage.getItem('kiroPages') || '[]') } catch { return [] } }
function savePages(p) { safeSetItem('kiroPages', JSON.stringify(p)) }

function loadHistory() { try { return JSON.parse(localStorage.getItem('linkHistory') || '[]') } catch { return [] } }
function saveHistory(items) { safeSetItem('linkHistory', JSON.stringify(items)) }

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

// ─── Expose as window globals for backward compat ──────
window.APP_VERSION = APP_VERSION
window.getVideos = getVideos
window.saveVideos = saveVideos
window.getFolders = getFolders
window.saveFolders = saveFolders
window.getFolderMeta = getFolderMeta
window.saveFolderMeta = saveFolderMeta
window.getPins = getPins
window.savePins = savePins
window.getBookmarks = getBookmarks
window.saveBookmarks = saveBookmarks
window.getDirectAccess = getDirectAccess
window.saveDirectAccess = saveDirectAccess
window.getNSFW = getNSFW
window.saveNSFW = saveNSFW
window.getBlurAllNSFW = getBlurAllNSFW
window.saveBlurAllNSFW = saveBlurAllNSFW
window.isNSFW = isNSFW
window.autoApplyNSFW = autoApplyNSFW
window.updateBatchBar = updateBatchBar
window.getNotes = getNotes
window.saveNotes = saveNotes
window.stripHtml = stripHtml
window.getCollapsed = getCollapsed
window.saveCollapsed = saveCollapsed
window.safeSetItem = safeSetItem
window.sanitizeHtml = sanitizeHtml
window.getUserName = getUserName
window.saveUserName = saveUserName
window.getExternalFiles = getExternalFiles
window.saveExternalFiles = saveExternalFiles
window.selectedGridItems = selectedGridItems
window.currentVideo = currentVideo
window.dragVideoId = dragVideoId
window.currentNoteId = currentNoteId
window.getPages = getPages
window.savePages = savePages
window.loadHistory = loadHistory
window.saveHistory = saveHistory
window.getInstalledAt = getInstalledAt
window.getLastOpenedAt = getLastOpenedAt
window.updateAppDates = updateAppDates
window.getStorageBreakdown = getStorageBreakdown
window.getVideoCount = getVideoCount
window.getNoteCount = getNoteCount
window.getBookmarkCount = getBookmarkCount
window.formatBytes = formatBytes
window.NSFW_DEFAULTS = NSFW_DEFAULTS
window.STORAGE_GROUPS = STORAGE_GROUPS

export {
  APP_VERSION,
  getVideos,
  saveVideos,
  getFolders,
  saveFolders,
  getFolderMeta,
  saveFolderMeta,
  getPins,
  savePins,
  getBookmarks,
  saveBookmarks,
  getDirectAccess,
  saveDirectAccess,
  getNSFW,
  saveNSFW,
  getBlurAllNSFW,
  saveBlurAllNSFW,
  isNSFW,
  autoApplyNSFW,
  updateBatchBar,
  getNotes,
  saveNotes,
  stripHtml,
  getCollapsed,
  saveCollapsed,
  safeSetItem,
  sanitizeHtml,
  getUserName,
  saveUserName,
  getExternalFiles,
  saveExternalFiles,
  selectedGridItems,
  currentVideo,
  dragVideoId,
  currentNoteId,
  getPages,
  savePages,
  loadHistory,
  saveHistory,
  getInstalledAt,
  getLastOpenedAt,
  getStorageBreakdown,
  getVideoCount,
  getNoteCount,
  getBookmarkCount,
  formatBytes,
  NSFW_DEFAULTS,
  STORAGE_GROUPS,
}

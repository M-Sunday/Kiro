var ICON_SUBDIRS = ['nav/', 'action/', 'media/', 'content/', 'view/', 'space/', '']
var ICON_CACHE = {
  play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>',
  pause: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>',
  'skip-back': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/><path d="M3 20V4"/></svg>',
  'skip-forward': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4v16"/><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/></svg>',
  'picture-in-picture-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>',
  folder: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>'
}

function getCached(name) {
  return ICON_CACHE[name] || null
}

function setCached(name, svg) {
  ICON_CACHE[name] = svg
}

function applySvg(el, svg) {
  var div = document.createElement('div')
  div.innerHTML = svg
  var svgEl = div.querySelector('svg')
  if (!svgEl) return
  svgEl.setAttribute('class', el.getAttribute('class') || '')
  if (el.style.width) svgEl.setAttribute('width', el.style.width)
  if (el.style.height) svgEl.setAttribute('height', el.style.height)
  if (el.style.color) svgEl.style.color = el.style.color
  if (el.style.flexShrink) svgEl.style.flexShrink = el.style.flexShrink
  el.replaceWith(svgEl)
}

function loadIcons(root) {
  var els = (root || document).querySelectorAll('[data-lucide]')
  els.forEach(function (el) {
    var name = el.getAttribute('data-lucide')
    if (!name) return
    var cached = getCached(name)
    if (cached) { applySvg(el, cached); return }
    tryFetch(el, name, 0)
  })
}

function tryFetch(el, name, i) {
  if (i >= ICON_SUBDIRS.length) return
  var base = 'assets/icons/ui/' + ICON_SUBDIRS[i]
  fetch(base + name + '.svg').then(function (r) {
    if (!r.ok) throw new Error()
    return r.text()
  }).then(function (svg) {
    setCached(name, svg)
    if (el.parentNode) applySvg(el, svg)
  }).catch(function () { tryFetch(el, name, i + 1) })
}

window.loadIcons = loadIcons

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { loadIcons() })
} else {
  loadIcons()
}

import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class NoteView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._noteSaveTimer = null
    this._pendingNoteId = null
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.openNote = (id) => this.openNote(id)
    window.closeNoteView = () => this.closeNoteView()
    window.renderNoteTodos = () => this.renderNoteTodos()
    window.addTodo = () => this.addTodo()
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('noteViewTitle'), 'input', () => this._noteSaveContent())
    this.listenTo(document.getElementById('noteViewContent'), 'input', () => this._noteSaveContent())
    this.listenTo(document.getElementById('noteViewContent'), 'blur', () => {
      if (this._autoLinkNoteContent()) this._noteSaveContent()
    })
    this.listenTo(document.getElementById('noteUndoBtn'), 'click', () => {
      const el = document.getElementById('noteViewContent')
      if (el) { el.focus(); document.execCommand('undo') }
    })
    this.listenTo(document.getElementById('noteRedoBtn'), 'click', () => {
      const el = document.getElementById('noteViewContent')
      if (el) { el.focus(); document.execCommand('redo') }
    })
    this.listenTo(document.getElementById('noteDeleteBtn'), 'click', () => {
      if (!window.currentNoteId) return
      let notes = (window.getNotes?.() || []).filter(x => x.id !== window.currentNoteId)
      window.saveNotes?.(notes)
      this.closeNoteView()
      if (window.renderSidebar) window.renderSidebar()
    })
    this.listenTo(document.getElementById('noteCloseBtn'), 'click', () => this.closeNoteView())
    this.listenTo(document.getElementById('newNoteBtn'), 'click', () => this._createNewNote())
    this.listenTo(document.getElementById('noteDialogCancel'), 'click', () => {
      document.getElementById('noteDialog')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('noteDialogConfirm'), 'click', () => this._confirmNoteDialog())
    this.listenTo(document.getElementById('noteTitleInput'), 'keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('noteContentInput')?.focus() }
    })
    this.listenTo(document.getElementById('noteDialog'), 'mousedown', (e) => {
      if (e.target === document.getElementById('noteDialog')) {
        document.getElementById('noteDialog')?.classList.remove('open')
      }
    })
    this.listenTo(document.getElementById('noteViewContent'), 'paste', (e) => this._handleNotePaste(e))
    this.listenTo(document.getElementById('noteTodoBtn'), 'click', () => this.addTodo())
  }

  openNote(id) {
    window.currentNoteId = id
    const notes = window.getNotes?.() || []
    const n = notes.filter(x => x.id === id)[0]
    if (!n) return
    window.setView?.('note')
    const titleEl = document.getElementById('noteViewTitle')
    const contentEl = document.getElementById('noteViewContent')
    const footerEl = document.getElementById('noteViewFooter')
    if (titleEl) titleEl.value = n.title || ''
    if (contentEl) contentEl.innerHTML = this._sanitizeHtml(n.content || '')
    if (footerEl) footerEl.textContent = `Last edited ${new Date(n.updated || n.added).toLocaleString()}`
    this.renderNoteTodos()
    if (window.renderSidebar) window.renderSidebar()
  }

  closeNoteView() {
    window.currentNoteId = null
    if (window.currentVideo) {
      window.setView?.('card')
      if (window.renderSidebar) window.renderSidebar()
    } else if (window.clearCard) {
      window.clearCard()
    }
  }

  _noteSaveContent() {
    clearTimeout(this._noteSaveTimer)
    this._pendingNoteId = window.currentNoteId
    this._noteSaveTimer = setTimeout(() => {
      if (!this._pendingNoteId || this._pendingNoteId !== window.currentNoteId) return
      this._autoLinkNoteContent()
      const notes = window.getNotes?.() || []
      const n = notes.filter(x => x.id === this._pendingNoteId)[0]
      if (!n) return
      const titleEl = document.getElementById('noteViewTitle')
      const contentEl = document.getElementById('noteViewContent')
      const footerEl = document.getElementById('noteViewFooter')
      if (titleEl) n.title = titleEl.value
      if (contentEl) n.content = this._sanitizeHtml(contentEl.innerHTML)
      n.updated = Date.now()
      window.saveNotes?.(notes)
      if (footerEl) footerEl.textContent = `Last edited ${new Date().toLocaleString()}`
      if (window.renderSidebar) window.renderSidebar()
    }, 300)
  }

  _autoLinkNoteContent() {
    const el = document.getElementById('noteViewContent')
    if (!el) return false
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false)
    const urlRegex = /https?:\/\/[^\s<>"']+|\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi
    const textNodes = []
    while (walker.nextNode()) textNodes.push(walker.currentNode)
    let changed = false
    for (const node of textNodes) {
      const text = node.textContent
      if (!urlRegex.test(text)) continue
      const parent = node.parentNode
      if (parent && parent.tagName === 'A') continue
      urlRegex.lastIndex = 0
      const frag = document.createDocumentFragment()
      let lastIndex = 0
      let match
      while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
        let url = match[0]
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        a.rel = 'noopener'
        a.textContent = match[0]
        frag.appendChild(a)
        lastIndex = urlRegex.lastIndex
      }
      if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)))
      if (frag.childNodes.length > 0) {
        parent.replaceChild(frag, node)
        changed = true
      }
    }
    return changed
  }

  _handleNotePaste(e) {
    const el = document.getElementById('noteViewContent')
    if (!el) return

    const items = e.clipboardData?.items
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/') && typeof item.getAsFile === 'function') {
          const blob = item.getAsFile()
          if (!blob) continue
          e.preventDefault()
          this._noteInsertImage(blob, el)
          return
        }
      }
    }

    this._noteReadClipboardImage(el).then(done => {
      if (done) { e.preventDefault(); return }
    })

    if (!e.clipboardData) {
      e.preventDefault()
      return
    }

    try {
      const html = e.clipboardData.getData('text/html')
      if (html && /<img[^>]+src\s*=\s*['"]data:image\//i.test(html)) {
        document.execCommand('insertHTML', false, html)
        this._noteSaveContent()
        return
      }
    } catch {}

    try {
      const text = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text/html')
      if (text) {
        e.preventDefault()
        document.execCommand('insertText', false, text)
        this._noteSaveContent()
      }
    } catch {}
  }

  _noteInsertImage(blob, el) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = document.createElement('img')
      img.src = ev.target.result
      img.style.cssText = 'max-width:100%;border-radius:8px;margin:8px 0;display:block'
      const sel = window.getSelection()
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      } else {
        el.appendChild(img)
      }
      this._noteSaveContent()
    }
    reader.readAsDataURL(blob)
  }

  async _noteReadClipboardImage(el) {
    if (typeof AndroidClipboard !== 'undefined') {
      const dataUri = AndroidClipboard.readImage()
      if (dataUri) {
        const resp = await fetch(dataUri)
        const blob = await resp.blob()
        this._noteInsertImage(blob, el)
        return true
      }
    }
    try {
      const clipboardItems = await navigator.clipboard?.read()
      if (clipboardItems) {
        for (const ci of clipboardItems) {
          for (const type of ci.types) {
            if (type.startsWith('image/')) {
              const blob = await ci.getType(type)
              if (blob) {
                this._noteInsertImage(blob, el)
                return true
              }
            }
          }
        }
      }
    } catch {}
    return false
  }

  _createNewNote() {
    const notes = window.getNotes?.() || []
    const id = '_nt_' + Date.now()
    notes.push({ id, title: 'Untitled', content: '', added: Date.now() })
    window.saveNotes?.(notes)
    if (window.renderSidebar) window.renderSidebar()
    this.openNote(id)
    if (window.closeSidebarMobile) window.closeSidebarMobile()
    setTimeout(() => {
      const titleEl = document.getElementById('noteViewTitle')
      if (titleEl) { titleEl.focus(); titleEl.select() }
    }, 100)
  }

  _confirmNoteDialog() {
    const titleInput = document.getElementById('noteTitleInput')
    const contentInput = document.getElementById('noteContentInput')
    const title = titleInput?.value.trim() || 'Untitled'
    const content = contentInput?.value || ''
    const notes = window.getNotes?.() || []
    const id = '_nt_' + Date.now()
    notes.push({ id, title, content, added: Date.now() })
    window.saveNotes?.(notes)
    if (titleInput) titleInput.value = ''
    if (contentInput) contentInput.value = ''
    document.getElementById('noteDialog')?.classList.remove('open')
    if (window.renderSidebar) window.renderSidebar()
    this.openNote(id)
    if (window.closeSidebarMobile) window.closeSidebarMobile()
  }

  renderNoteTodos() {
    const el = document.getElementById('noteViewTodos')
    if (!el) return
    const notes = window.getNotes?.() || []
    const n = notes.find(x => x.id === window.currentNoteId)
    if (!n || !n.todos || !n.todos.length) { el.innerHTML = ''; return }

    let html = '<div style="border-top:1px solid #e8e8ed;padding-top:8px;margin-top:4px">'
    n.todos.forEach((t, i) => {
      const checked = t.done ? ' checked' : ''
      html += '<div class="todo-row"><span class="todo-cb' + checked + '" data-todo-id="' + t.id + '">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="todo-cb-icon todo-cb-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="todo-cb-icon todo-cb-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg></span>' +
        '<span class="todo-text' + (t.done ? ' done' : '') + '" contenteditable="true" data-todo-id="' + t.id + '" spellcheck="false">' + this._escapeHtml(t.text || '') + '</span></div>'
    })
    html += '<button class="todo-add-btn" id="todoAddBtn"><i data-lucide="plus" style="width:14px;height:14px"></i> Add todo</button></div>'
    el.innerHTML = html

    el.querySelectorAll('.todo-cb').forEach(cb => {
      cb.addEventListener('click', (e) => {
        const notes = window.getNotes?.() || []
        const n = notes.find(x => x.id === window.currentNoteId)
        if (!n || !n.todos) return
        const t = n.todos.find(x => x.id === cb.dataset.todoId)
        if (!t) return
        const becomingDone = !t.done
        t.done = becomingDone
        window.saveNotes?.(notes)
        if (becomingDone) {
          cb.querySelector('.todo-cb-check').style.color = '#30d158'
          setTimeout(() => { this.renderNoteTodos(); if (window.renderSidebar) window.renderSidebar() }, 180)
        } else {
          this.renderNoteTodos()
          if (window.renderSidebar) window.renderSidebar()
        }
        this._todoBurst(e.clientX, e.clientY, becomingDone)
      })
    })

    el.querySelectorAll('.todo-text').forEach(span => {
      span.addEventListener('blur', () => {
        const notes = window.getNotes?.() || []
        const n = notes.find(x => x.id === window.currentNoteId)
        if (!n || !n.todos) return
        const t = n.todos.find(x => x.id === span.dataset.todoId)
        if (t) { t.text = span.textContent.trim(); window.saveNotes?.(notes); if (window.renderSidebar) window.renderSidebar() }
      })
      span.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); span.blur() }
      })
    })

    this.listenTo(document.getElementById('todoAddBtn'), 'click', () => this.addTodo())
    if (window.loadIcons) window.loadIcons(el)
  }

  addTodo() {
    if (!window.currentNoteId) return
    const notes = window.getNotes?.() || []
    const n = notes.find(x => x.id === window.currentNoteId)
    if (!n) return
    n.todos = n.todos || []
    n.todos.push({ id: '_td_' + Date.now(), text: '', done: false })
    n.updated = Date.now()
    window.saveNotes?.(notes)
    this.renderNoteTodos()
    if (window.renderSidebar) window.renderSidebar()
    const lastText = document.querySelector('#noteViewTodos .todo-text:last-of-type')
    if (lastText) lastText.focus()
  }

  _todoBurst(clientX, clientY, becomingDone) {
    const colors = ['#007aff','#ff453a','#ffd60a','#30d158','#ff9f0a','#bf5af2']
    for (let p = 0; p < 12; p++) {
      const dot = document.createElement('div')
      const size = 2 + Math.random() * 4
      let color = colors[Math.floor(Math.random() * colors.length)]
      if (!becomingDone) color = '#ff453a'
      dot.className = 'todo-particle'
      dot.style.cssText = 'position:fixed;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';pointer-events:none;z-index:99999;left:' + (clientX - size/2) + 'px;top:' + (clientY - size/2) + 'px;box-shadow:0 0 ' + (size * 2) + 'px ' + color
      document.body.appendChild(dot)
      const angle = Math.random() * 360
      const dist = 20 + Math.random() * 30
      const dx = Math.cos(angle * Math.PI / 180) * dist
      const dy = Math.sin(angle * Math.PI / 180) * dist
      dot.style.transition = 'transform 0.45s cubic-bezier(0,.8,.5,1), opacity 0.45s ease, box-shadow 0.45s ease'
      requestAnimationFrame(() => {
        dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)'
        dot.style.opacity = '0'
        dot.style.boxShadow = 'none'
      })
      setTimeout(() => { if (dot.parentNode) dot.parentNode.removeChild(dot) }, 500)
    }
  }

  _escapeHtml(str) {
    if (typeof str !== 'string') return ''
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return str.replace(/[&<>"']/g, ch => map[ch])
  }

  _sanitizeHtml(str) {
    if (!str) return ''
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
}

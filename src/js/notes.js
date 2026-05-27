// ─── Notes ──────────────────────────────────────────────
const noteDialog = document.getElementById('noteDialog')
const noteTitleInput = document.getElementById('noteTitleInput')
const noteContentInput = document.getElementById('noteContentInput')

function openNote(id) {
  currentNoteId = id
  const notes = getNotes()
  const n = notes.filter(x => x.id === id)[0]
  if (!n) return
  setView('note')
  document.getElementById('noteViewTitle').value = n.title || ''
  document.getElementById('noteViewContent').innerHTML = sanitizeHtml(n.content || '')
  document.getElementById('noteViewFooter').textContent = `Last edited ${new Date(n.updated || n.added).toLocaleString()}`
  renderSidebar()
}

let noteSaveTimer = null
let pendingNoteId = null
document.getElementById('noteViewTitle').addEventListener('input', noteSaveContent)
document.getElementById('noteViewContent').addEventListener('input', noteSaveContent)
document.getElementById('noteViewContent').addEventListener('blur', function () {
  if (autoLinkNoteContent()) noteSaveContent()
})

function autoLinkNoteContent() {
  const el = document.getElementById('noteViewContent')
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

function noteSaveContent() {
  clearTimeout(noteSaveTimer)
  pendingNoteId = currentNoteId
  noteSaveTimer = setTimeout(() => {
    if (!pendingNoteId || pendingNoteId !== currentNoteId) return
    autoLinkNoteContent()
    const notes = getNotes()
    const n = notes.filter(x => x.id === pendingNoteId)[0]
    if (!n) return
    n.title = document.getElementById('noteViewTitle').value
    n.content = sanitizeHtml(document.getElementById('noteViewContent').innerHTML)
    n.updated = Date.now()
    saveNotes(notes)
    document.getElementById('noteViewFooter').textContent = `Last edited ${new Date().toLocaleString()}`
    renderSidebar()
  }, 300)
}

document.getElementById('noteUndoBtn').addEventListener('click', () => {
  document.getElementById('noteViewContent').focus()
  document.execCommand('undo')
})
document.getElementById('noteRedoBtn').addEventListener('click', () => {
  document.getElementById('noteViewContent').focus()
  document.execCommand('redo')
})

document.getElementById('noteViewContent').addEventListener('paste', function (e) {
  const items = e.clipboardData?.items
  let handled = false
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/') && typeof item.getAsFile === 'function') {
        const blob = item.getAsFile()
        if (!blob) continue
        e.preventDefault()
        handled = true
        const reader = new FileReader()
        reader.onload = function (ev) {
          const img = document.createElement('img')
          img.src = ev.target.result
          img.style.maxWidth = '100%'
          img.style.borderRadius = '8px'
          img.style.margin = '8px 0'
          img.style.display = 'block'
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
            this.appendChild(img)
          }
          noteSaveContent()
        }
        reader.readAsDataURL(blob)
        break
      }
    }
  }
  if (!handled) {
    setTimeout(noteSaveContent, 0)
  }
})

document.getElementById('noteDeleteBtn').addEventListener('click', () => {
  if (!currentNoteId) return
  let notes = getNotes().filter(x => x.id !== currentNoteId)
  saveNotes(notes)
  closeNoteView()
  renderSidebar()
})
document.getElementById('noteCloseBtn').addEventListener('click', closeNoteView)

// Note dialog
document.getElementById('newNoteBtn').addEventListener('click', () => {
  const notes = getNotes()
  const id = '_nt_' + Date.now()
  notes.push({ id, title: 'Untitled', content: '', added: Date.now() })
  saveNotes(notes)
  renderSidebar()
  openNote(id)
  setTimeout(() => { document.getElementById('noteViewTitle').focus(); document.getElementById('noteViewTitle').select() }, 100)
})
document.getElementById('noteDialogCancel').addEventListener('click', () => noteDialog.classList.remove('open'))
document.getElementById('noteDialogConfirm').addEventListener('click', () => {
  const title = noteTitleInput.value.trim() || 'Untitled'
  const content = noteContentInput.value
  const notes = getNotes()
  const id = '_nt_' + Date.now()
  notes.push({ id, title, content, added: Date.now() })
  saveNotes(notes)
  noteTitleInput.value = ''; noteContentInput.value = ''
  noteDialog.classList.remove('open')
  renderSidebar()
  openNote(id)
})
noteTitleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); noteContentInput.focus() } })
noteDialog.addEventListener('mousedown', (e) => { if (e.target === noteDialog) noteDialog.classList.remove('open') })

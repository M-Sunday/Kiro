import { Component } from './base/Component'
import type { Video } from '../../shared/types'

export class CardView extends Component {
  private _contentEl: HTMLElement | null = null
  private _thumbnailEl: HTMLImageElement | null = null
  private _titleEl: HTMLElement | null = null
  private _channelEl: HTMLElement | null = null
  private _durationEl: HTMLElement | null = null
  private _pinBadgeEl: HTMLElement | null = null
  private _addBtnEl: HTMLElement | null = null
  private _copyBtnEl: HTMLElement | null = null
  private _dlBtnEl: HTMLElement | null = null
  private _currentVideoId: string | null = null

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = this._baseHTML()
    this._contentEl = this.rootEl.querySelector('.content')
    this._thumbnailEl = this.rootEl.querySelector('#thumbnail')
    this._titleEl = this.rootEl.querySelector('#videoTitle')
    this._channelEl = this.rootEl.querySelector('#channelName')
    this._durationEl = this.rootEl.querySelector('#durationBadge')
    this._pinBadgeEl = this.rootEl.querySelector('#pinBadge')
    this._addBtnEl = this.rootEl.querySelector('#cardAddBtn')
    this._copyBtnEl = this.rootEl.querySelector('#copyLinkBtn')
    this._dlBtnEl = this.rootEl.querySelector('#dlBtn')

    this.listenTo(this.rootEl.querySelector('#imageWrap'), 'click', this._openLink.bind(this) as EventListener)
    this.listenTo(this._copyBtnEl, 'click', this._copyLink.bind(this) as EventListener)
    this.listenTo(this._addBtnEl, 'click', this._toggleSave.bind(this) as EventListener)
    this.listenTo(this._dlBtnEl, 'click', this._requestDownload.bind(this) as EventListener)

    this.on('ui:card:load-video', (payload: { id: string }) => this.loadVideo(payload.id))
    this.on('search:started', () => this._showSearching())
    this.on('search:complete', (payload: { videoId: string; metadata: Record<string, unknown> }) => {
      this._updateFromMetadata(payload.metadata)
    })
    this.on('search:enriched', (payload: { videoId: string; metadata: Record<string, unknown> }) => {
      this._updateFromMetadata(payload.metadata)
    })
    this.on('search:failed', () => this._showError())

    this.subscribe('videos', () => this._syncState())
    this.subscribe('pins', () => this._syncState())
  }

  loadVideo(id: string): void {
    this._currentVideoId = id
    this.state.setCurrentVideoId(id)
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    const video = videos[id]

    if (video) {
      this._populateVideo(video)
    } else {
      this._showSearching()
    }
  }

  clear(): void {
    this._currentVideoId = null
    this._showEmpty()
  }

  override destroy(): void {
    this._contentEl = null
    this._thumbnailEl = null
    this._titleEl = null
    this._channelEl = null
    this._durationEl = null
    this._pinBadgeEl = null
    this._addBtnEl = null
    this._copyBtnEl = null
    this._dlBtnEl = null
    super.destroy()
  }

  private _baseHTML(): string {
    return `
      <div class="content" style="display:none">
        <div class="card">
          <div class="card-image">
            <div id="imageWrap" style="cursor:pointer">
              <img id="thumbnail" data-ref="thumbnail" src="" alt="Video thumbnail" />
              <span id="durationBadge" data-ref="durationBadge" class="duration-badge"></span>
              <div id="pinBadge" data-ref="pinBadge" class="pin-badge" style="display:none">📌</div>
            </div>
          </div>
          <div class="card-info">
            <h2 id="videoTitle" data-ref="videoTitle"></h2>
            <p id="channelName" data-ref="channelName"></p>
            <div class="card-actions" id="cardAddRow">
              <button id="cardAddBtn" data-ref="cardAddBtn">Save</button>
              <button id="copyLinkBtn" data-ref="copyLinkBtn">Copy link</button>
              <button id="dlBtn" data-ref="dlBtn">Download</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private _populateVideo(video: Video): void {
    if (this._thumbnailEl) this._thumbnailEl.src = video.thumbnail
    if (this._titleEl) this._titleEl.textContent = video.title
    if (this._channelEl) this._channelEl.textContent = video.channel
    if (this._durationEl) this._durationEl.textContent = video.duration
    if (this._contentEl) this._contentEl.style.display = ''
    this._updatePinBadge(video.videoId)
    this._updateAddButton(video.videoId)
  }

  private _showSearching(): void {
    if (this._thumbnailEl) this._thumbnailEl.src = ''
    if (this._titleEl) this._titleEl.textContent = 'Searching...'
    if (this._channelEl) this._channelEl.textContent = ''
    if (this._durationEl) this._durationEl.textContent = ''
    if (this._contentEl) this._contentEl.style.display = ''
  }

  private _showError(): void {
    if (this._titleEl) this._titleEl.textContent = 'Could not load video info'
    if (this._contentEl) this._contentEl.style.display = ''
  }

  private _showEmpty(): void {
    if (this._contentEl) this._contentEl.style.display = 'none'
  }

  private _updateFromMetadata(metadata: Record<string, unknown>): void {
    const title = metadata['title'] as string | undefined
    const channel = metadata['channel'] as string | undefined
    const duration = metadata['duration'] as string | undefined
    const thumbnail = metadata['thumbnail'] as string | undefined

    if (title && this._titleEl) this._titleEl.textContent = title
    if (channel && this._channelEl) this._channelEl.textContent = channel
    if (duration && this._durationEl) this._durationEl.textContent = duration
    if (thumbnail && this._thumbnailEl) this._thumbnailEl.src = thumbnail
  }

  private _updatePinBadge(videoId: string): void {
    const pins = this.state.get<string[]>('pins') ?? []
    const isPinned = pins.includes(videoId)
    if (this._pinBadgeEl) this._pinBadgeEl.style.display = isPinned ? '' : 'none'
  }

  private _updateAddButton(videoId: string): void {
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    const isSaved = !!videos[videoId]
    if (this._addBtnEl) {
      this._addBtnEl.textContent = isSaved ? 'Unlink' : 'Save'
      this._addBtnEl.classList.toggle('saved', isSaved)
    }
  }

  private _syncState(): void {
    if (!this._currentVideoId) return
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    const video = videos[this._currentVideoId]
    if (video) {
      this._updatePinBadge(this._currentVideoId)
      this._updateAddButton(this._currentVideoId)
    }
  }

  private _openLink(): void {
    if (!this._currentVideoId) return
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    const video = videos[this._currentVideoId]
    if (video?.url) window.open(video.url, '_blank')
  }

  private _copyLink(): void {
    if (!this._currentVideoId) return
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    const video = videos[this._currentVideoId]
    if (!video?.url) return
    navigator.clipboard.writeText(video.url).catch(() => {})
  }

  private _toggleSave(): void {
    if (!this._currentVideoId) return
    const videos = this.state.get<Record<string, Video>>('videos') ?? {}
    if (videos[this._currentVideoId]) {
      this.emit('ui:video:delete', { id: this._currentVideoId })
    } else {
      const v = {
        videoId: this._currentVideoId,
        title: this._titleEl?.textContent ?? 'Unknown',
        channel: this._channelEl?.textContent ?? 'Unknown',
        duration: this._durationEl?.textContent ?? '',
        thumbnail: this._thumbnailEl?.src ?? '',
        url: `https://youtube.com/watch?v=${this._currentVideoId}`,
        added: Date.now(),
        blurred: false,
        archived: false,
      }
      this.emit('ui:video:create', { data: v })
    }
  }

  private _requestDownload(): void {
    if (this._currentVideoId) {
      this.emit('ui:download:start', { videoId: this._currentVideoId })
    }
  }
}

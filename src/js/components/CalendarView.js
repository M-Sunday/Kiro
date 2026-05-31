import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export class CalendarView extends Component {
  constructor() {
    super()
    this.month = new Date().getMonth()
    this.year = new Date().getFullYear()
    this.publishedDate = null
    this.privacyStatus = 'PUBLIC'
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.setPublishedDate = (d) => this.setPublishedDate(d)
    window.updatePrivacy = (s) => this.updatePrivacy(s)
    window.renderCalendar = () => this.render()
  }

  mount(rootEl) {
    super.mount(rootEl)
    this.render()
  }

  setPublishedDate(date) {
    this.publishedDate = date
    this.month = date.getMonth()
    this.year = date.getFullYear()
    this.render()
  }

  updatePrivacy(status) {
    this.privacyStatus = status || 'PUBLIC'
    this.render()
  }

  prevMonth() {
    this.month--
    if (this.month < 0) { this.month = 11; this.year-- }
    this.render()
  }

  nextMonth() {
    this.month++
    if (this.month > 11) { this.month = 0; this.year++ }
    this.render()
  }

  render() {
    if (!this.rootEl) return

    const firstDay = new Date(this.year, this.month, 1).getDay()
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate()
    const prevMonthDays = new Date(this.year, this.month, 0).getDate()
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

    const privacyConfig = {
      PUBLIC: { label: 'Public', cls: 'public' },
      UNLISTED: { label: 'Unlisted', cls: 'unlisted' },
      PRIVATE: { label: 'Private', cls: 'private' },
    }
    const p = privacyConfig[this.privacyStatus] || privacyConfig.PUBLIC

    let html = `<div class="cal-header">
      <div class="cal-header-left"><h2>${MONTH_NAMES[this.month]} ${this.year}</h2></div>
      <div class="cal-header-right">
        <span class="cal-privacy ${p.cls}" id="privacyBadge"><span class="dot"></span> ${p.label}</span>
        <div class="cal-nav">
          <button class="cal-prev">‹</button>
          <button class="cal-next">›</button>
        </div>
      </div>
    </div><div class="cal-grid">`

    for (const name of DAY_NAMES) {
      html += `<div class="cal-day-name">${name}</div>`
    }

    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-date other-month">${prevMonthDays - i}</div>`
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = todayStr === `${this.year}-${this.month}-${d}`
      const isPublished = this.publishedDate &&
        d === this.publishedDate.getDate() &&
        this.month === this.publishedDate.getMonth() &&
        this.year === this.publishedDate.getFullYear()
      html += `<div class="cal-date${isToday ? ' today' : ''}${isPublished ? ' published' : ''}">${d}</div>`
    }

    const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="cal-date other-month">${d}</div>`
    }

    html += '</div>'
    this.rootEl.innerHTML = html

    const prevBtn = this.rootEl.querySelector('.cal-prev')
    const nextBtn = this.rootEl.querySelector('.cal-next')
    if (prevBtn) prevBtn.addEventListener('click', () => this.prevMonth())
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth())
  }
}

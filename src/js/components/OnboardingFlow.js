import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'
import { APP_VERSION } from '../data.js'

export class OnboardingFlow extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._init()
  }

  _init() {
    if (window.getUserName?.()) return

    const splash = document.getElementById('splash')
    const onboarding = document.getElementById('onboarding')
    const step1 = document.getElementById('onbStep1')
    const nameInput = document.getElementById('onbNameInput')
    const stage = document.getElementById('onbStage')
    const infoContent = document.getElementById('onbInfoContent')
    const backBtn = document.getElementById('onbBack')

    if (!splash || !onboarding || !nameInput) return

    const footerVersion = document.getElementById('onbFooterVersion')
    if (footerVersion) footerVersion.textContent = 'v' + APP_VERSION

    const infoData = {
      appinfo: 'a local-first space<br>for your videos<br>bookmarks notes<br>and ideas<br>no algorithms<br>no noise',
      privacy: 'kiro lives on your device<br>your data stays local<br>we never collect<br>share or sell<br>your information'
    }
    let currentInfo = null
    let showBackTimer = null

    function openInfo(action) {
      if (currentInfo === action) { closeInfo(); return }
      if (currentInfo) {
        if (infoContent) infoContent.innerHTML = infoData[action]
        currentInfo = action
        return
      }
      currentInfo = action
      if (infoContent) infoContent.innerHTML = infoData[action]
      if (stage) stage.classList.add('info-open')
      splash.classList.add('info-bg')
      showBackTimer = setTimeout(() => { if (backBtn) backBtn.classList.add('visible') }, 1000)
    }

    function closeInfo() {
      currentInfo = null
      clearTimeout(showBackTimer)
      if (backBtn) backBtn.classList.remove('visible')
      splash.classList.remove('info-bg')
      if (stage) stage.classList.remove('info-open')
    }

    if (backBtn) backBtn.addEventListener('click', closeInfo)

    document.querySelectorAll('.onb-choice').forEach(el => {
      el.addEventListener('click', function (e) {
        e.stopPropagation()
        if (this.dataset.action === 'setup') { closeInfo(); goToStep1(); return }
        openInfo(this.dataset.action)
      })
    })

    function goToStep1() {
      setTimeout(() => {
        splash.style.display = 'none'
        onboarding.style.display = 'flex'
        onboarding.classList.remove('onb-hidden')
        if (step1) {
          step1.style.display = 'block'
          step1.classList.remove('onb-hidden')
        }
        requestAnimationFrame(() => {
          const prompt = step1?.querySelector('.onb-prompt')
          if (prompt) prompt.classList.add('onb-visible')
          if (nameInput) {
            nameInput.style.opacity = '1'
            nameInput.style.transform = 'translateY(0)'
          }
        })
        setTimeout(() => { if (nameInput) nameInput.focus() }, 400)
      }, 200)
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim()) finishOnboarding(this.value.trim())
      })
    }

    function finishOnboarding(name) {
      if (window.saveUserName) window.saveUserName(name)

      onboarding.style.display = 'none'
      splash.style.display = 'none'

      if (window.startApp) window.startApp()

      setTimeout(() => {
        const wb = document.querySelector('.grid-workbench')
        if (wb) {
          wb.classList.remove('grid-section-anim')
          wb.style.opacity = '1'
          wb.style.transform = 'translateY(0)'
        }
        if (window.startGridAnim) window.startGridAnim()
      }, 250)
    }
  }
}

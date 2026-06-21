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
    const splash = document.getElementById('splash')
    const onbStep0 = document.getElementById('onbStep0')
    const onboarding = document.getElementById('onboarding')
    const onbStep1 = document.getElementById('onbStep1')
    const nameInput = document.getElementById('onbNameInput')
    const stage = document.getElementById('onbStage')
    const infoContent = document.getElementById('onbInfoContent')
    const backBtn = document.getElementById('onbBack')
    const eulaOverlay = document.getElementById('eulaOverlay')
    const eulaAccept = document.getElementById('eulaAccept')
    const eulaDecline = document.getElementById('eulaDecline')
    const eulaAcceptMsg = document.getElementById('eulaAcceptMsg')

    if (!splash || !onbStep0) return

    const footerVersion = document.getElementById('onbFooterVersion')
    if (footerVersion) footerVersion.textContent = 'v' + APP_VERSION

    const userName = window.getUserName?.() || localStorage.getItem('kiroUserName')
    const eulaAccepted = localStorage.getItem('kiroEulaAccepted') === 'true'

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
        if (onbStep1) {
          onbStep1.style.display = 'block'
          onbStep1.classList.remove('onb-hidden')
        }
        requestAnimationFrame(() => {
          const prompt = onbStep1?.querySelector('.onb-prompt')
          if (prompt) prompt.classList.add('onb-visible')
          if (nameInput) {
            nameInput.style.opacity = '1'
            nameInput.style.transform = 'translateY(0)'
          }
        })
        setTimeout(() => { if (nameInput) nameInput.focus() }, 400)
      }, 200)
    }

    const actions = document.getElementById('onbActions')
    const yesBtn = document.getElementById('onbYes')
    const noBtn = document.getElementById('onbNo')

    function showActions() {
      if (!actions) return
      actions.style.display = 'flex'
      requestAnimationFrame(() => actions.classList.add('onb-visible'))
    }
    function hideActions() {
      if (!actions) return
      actions.classList.remove('onb-visible')
      actions.style.display = 'none'
    }

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        if (this.value.trim()) showActions()
        else hideActions()
      })
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && this.value.trim()) finishOnboarding(this.value.trim())
      })
    }

    if (yesBtn) {
      yesBtn.addEventListener('click', function () {
        const val = nameInput?.value.trim()
        if (val) finishOnboarding(val)
      })
    }

    if (noBtn) {
      noBtn.addEventListener('click', function () {
        hideActions()
        if (nameInput) { nameInput.value = ''; nameInput.style.opacity = '0'; nameInput.style.transform = 'translateY(20px)' }
        if (onbStep1) { onbStep1.style.display = 'none'; onbStep1.classList.add('onb-hidden') }
        onboarding.style.display = 'none'
        onboarding.classList.add('onb-hidden')
        splash.style.display = 'flex'
        onbStep0.classList.remove('onb-hidden')
      })
    }

    function finishOnboarding(name) {
      if (window.saveUserName) window.saveUserName(name)

      onboarding.style.display = 'none'
      splash.style.display = 'none'

      if (window.startApp) window.startApp()

      setTimeout(() => {
        const db = document.querySelector('.grid-dashboard')
        if (db) {
          db.classList.remove('grid-section-anim')
          db.style.opacity = '1'
          db.style.transform = 'translateY(0)'
        }
        if (window.startGridAnim) window.startGridAnim()
      }, 250)
    }

    // ── EULA wiring ──
    function showEula() {
      if (!eulaOverlay) return
      eulaOverlay.style.display = 'flex'
      requestAnimationFrame(() => eulaOverlay.classList.add('open'))
    }

    function hideEula() {
      if (!eulaOverlay) return
      eulaOverlay.classList.remove('open')
      eulaOverlay.style.display = 'none'
    }

    if (eulaAccept) {
      eulaAccept.addEventListener('click', function () {
        localStorage.setItem('kiroEulaAccepted', 'true')
        hideEula()
        showWelcome()
      })
    }

    if (eulaDecline) {
      eulaDecline.addEventListener('click', function () {
        if (eulaAcceptMsg) {
          eulaAcceptMsg.style.display = 'block'
          eulaAcceptMsg.textContent = 'You must accept the terms to use this app.'
        }
      })
    }

    if (eulaOverlay) {
      eulaOverlay.addEventListener('click', function (e) {
        if (e.target === this && eulaAcceptMsg) {
          eulaAcceptMsg.style.display = 'block'
          eulaAcceptMsg.textContent = 'Please accept the terms above to continue.'
        }
      })
    }

    // ── Welcome screen ──
    function showWelcome() {
      onbStep0.classList.remove('onb-hidden')
    }

    // ── Decide flow ──
    if (userName) {
      setTimeout(() => {
        window.__splashFade(() => {
          if (window.startApp) window.startApp()
        })
      }, 0)
    } else {
      // First-time user
      if (eulaAccepted) {
        showWelcome()
      } else {
        setTimeout(showEula, 800)
      }
    }
  }
}

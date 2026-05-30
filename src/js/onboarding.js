// ─── Onboarding (first-time user flow) ──────────────────
;(function() {
  if (getUserName()) return

  var splash = document.getElementById('splash')
  var step0 = document.getElementById('onbStep0')
  var onboarding = document.getElementById('onboarding')
  var step1 = document.getElementById('onbStep1')
  var nameInput = document.getElementById('onbNameInput')
  var stage = document.getElementById('onbStage')
  var infoContent = document.getElementById('onbInfoContent')
  var backBtn = document.getElementById('onbBack')

  // Set footer version
  document.getElementById('onbFooterVersion').textContent = 'v' + APP_VERSION

  // ─── Info content ────────────────────────────────────

  var infoData = {
    appinfo: 'a local-first space<br>for your videos<br>bookmarks notes<br>and ideas<br>no algorithms<br>no noise',
    privacy: 'kiro lives on your device<br>your data stays local<br>we never collect<br>share or sell<br>your information'
  }
  var currentInfo = null
  var showBackTimer = null

  function openInfo(action) {
    if (currentInfo === action) { closeInfo(); return }
    if (currentInfo) {
      infoContent.innerHTML = infoData[action]
      currentInfo = action
      return
    }
    currentInfo = action
    infoContent.innerHTML = infoData[action]
    stage.classList.add('info-open')
    splash.classList.add('info-bg')
    showBackTimer = setTimeout(function() { backBtn.classList.add('visible') }, 1000)
  }

  function closeInfo() {
    currentInfo = null
    clearTimeout(showBackTimer)
    backBtn.classList.remove('visible')
    splash.classList.remove('info-bg')
    stage.classList.remove('info-open')
  }

  backBtn.addEventListener('click', closeInfo)

  document.querySelectorAll('.onb-choice').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation()
      if (this.dataset.action === 'setup') { closeInfo(); goToStep1(); return }
      openInfo(this.dataset.action)
    })
  })

  // ─── Step 1 (name input) ─────────────────────────────

  function goToStep1() {
    setTimeout(function() {
      splash.style.display = 'none'
      onboarding.style.display = 'flex'
      onboarding.classList.remove('onb-hidden')
      step1.style.display = 'block'
      step1.classList.remove('onb-hidden')
      requestAnimationFrame(function() {
        step1.querySelector('.onb-prompt').classList.add('onb-visible')
        nameInput.style.opacity = '1'
        nameInput.style.transform = 'translateY(0)'
      })
      setTimeout(function() { nameInput.focus() }, 400)
    }, 200)
  }

  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) finishOnboarding(this.value.trim())
  })

  function finishOnboarding(name) {
    saveUserName(name)

    onboarding.style.display = 'none'
    splash.style.display = 'none'

    if (window.startApp) window.startApp()

    setTimeout(function() {
      var wb = document.querySelector('.grid-workbench')
      if (wb) {
        wb.classList.remove('grid-section-anim')
        wb.style.opacity = '1'
        wb.style.transform = 'translateY(0)'
      }

      if (window.startGridAnim) window.startGridAnim()
    }, 250)
  }
})()

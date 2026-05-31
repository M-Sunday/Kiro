// ─── LEGACY: Old app init (coexists with new ES module system) ──
document.getElementById('appVersionLabel').textContent = APP_VERSION
if (window.innerWidth <= 640) document.getElementById('sidebar').classList.add('closed')

function requestStoragePermission() {
  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      var Permissions = window.Capacitor.Plugins.Permissions
      if (!Permissions) return
      Permissions.query({ name: 'storage' }).then(function (r) {
        if (r.state === 'denied' || r.state === 'prompt') {
          Permissions.request({ name: 'storage' })
        }
      })
    }
  } catch (_) {}
}

function startApp() {
  loadIcons(); renderCalendar(); renderSidebar(); renderGridView(); setView('grid')
  requestStoragePermission()
}
if (getUserName()) {
  startApp()
} else {
  window.startApp = startApp
}

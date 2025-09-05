// Background service worker: captures the visible tab and opens editor

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CAPTURE_SCREENSHOT') {
    captureAndOpenEditor().then(() => sendResponse({ ok: true })).catch((err) => {
      console.error('Capture failed', err)
      sendResponse({ ok: false, error: String(err) })
    })
    // Keep the message channel open for async response
    return true
  }
})

async function captureAndOpenEditor() {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    try {
      // Overload: captureVisibleTab(options, callback)
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
          return
        }
        if (!dataUrl) {
          reject('No data URL from captureVisibleTab')
          return
        }
        resolve(dataUrl)
      })
    } catch (e) {
      reject(e)
    }
  })

  await chrome.storage.local.set({ latestCapture: dataUrl })

  await chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') })
}

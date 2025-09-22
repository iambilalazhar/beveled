// Background service worker: captures screenshots with various options and opens editor

export interface CaptureOptions {
  type: 'visible' | 'fullpage' | 'viewport'
  viewport?: {
    width: number
    height: number
    deviceScaleFactor?: number
    isMobile?: boolean
  }
}

export interface ViewportPreset {
  name: string
  width: number
  height: number
  deviceScaleFactor: number
  isMobile: boolean
  userAgent?: string
}

// Common viewport presets for different devices
export const VIEWPORT_PRESETS: Record<string, ViewportPreset> = {
  'mobile-portrait': {
    name: 'Mobile Portrait',
    width: 375,
    height: 812,
    deviceScaleFactor: 3,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  'mobile-landscape': {
    name: 'Mobile Landscape', 
    width: 812,
    height: 375,
    deviceScaleFactor: 3,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  'tablet-portrait': {
    name: 'Tablet Portrait',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  'tablet-landscape': {
    name: 'Tablet Landscape',
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  'desktop-small': {
    name: 'Desktop Small',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false
  },
  'desktop-medium': {
    name: 'Desktop Medium',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false
  },
  'desktop-large': {
    name: 'Desktop Large',
    width: 2560,
    height: 1440,
    deviceScaleFactor: 1,
    isMobile: false
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CAPTURE_SCREENSHOT') {
    const options: CaptureOptions = message.options || { type: 'visible' }
    captureAndOpenEditor(options, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error('Capture failed', err)
        sendResponse({ ok: false, error: String(err) })
      })
    // Keep the message channel open for async response
    return true
  }

  if (message?.type === 'CAPTURE_VISIBLE_SEGMENT') {
    const tab = sender.tab
    if (!tab) {
      sendResponse({ error: 'No tab context for segment capture' })
      return
    }

    focusTab(tab)
      .catch(() => undefined)
      .then(() => captureVisibleArea(tab))
      .then((dataUrl) => sendResponse({ dataUrl }))
      .catch((error) => {
        console.error('Segment capture failed', error)
        sendResponse({ error: String(error) })
      })

    return true
  }
})

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const CAPTURE_MIN_INTERVAL_MS = 700
let lastCaptureTimestamp = 0

function isRestrictedUrl(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://')
  )
}

async function focusTab(tab: chrome.tabs.Tab): Promise<void> {
  if (tab.windowId !== undefined) {
    await new Promise<void>((resolve, reject) => {
      chrome.windows.update(tab.windowId!, { focused: true }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        resolve()
      })
    })
  }

  if (tab.id === undefined || tab.active) return

  await new Promise<void>((resolve, reject) => {
    chrome.tabs.update(tab.id!, { active: true }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })
}

function isNormalCapturableTab(tab: chrome.tabs.Tab | undefined | null): tab is chrome.tabs.Tab {
  return !!tab && tab.id !== undefined && tab.windowId !== undefined && !isRestrictedUrl(tab.url)
}

async function getCaptureTab(sender?: chrome.runtime.MessageSender): Promise<chrome.tabs.Tab> {
  const senderTab = sender?.tab
  if (isNormalCapturableTab(senderTab)) {
    try {
      await focusTab(senderTab)
      await sleep(120)
      return senderTab
    } catch (error) {
      console.warn('Failed to focus sender tab for capture:', error)
    }
  }

  const activeTabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true, windowType: 'normal' })
  const activeCandidate = activeTabs.find(isNormalCapturableTab)
  if (activeCandidate) {
    await focusTab(activeCandidate)
    await sleep(150)
    return activeCandidate
  }

  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] })
  const sorted = windows
    .flatMap((win) => win.tabs ?? [])
    .filter(isNormalCapturableTab)
    .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))

  const target = sorted[0]
  if (!target) {
    throw new Error('No capturable browser tab detected. Focus the page you want to capture and try again.')
  }

  await focusTab(target)
  await sleep(150)
  return target
}

async function ensureContentScript(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-script.js']
  })
}

function sendMessageToTab<T = unknown>(tabId: number, message: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve(response as T)
    })
  })
}

async function attachDebugger(tabId: number): Promise<chrome.debugger.Debuggee> {
  const debuggee: chrome.debugger.Debuggee = { tabId }

  await new Promise<void>((resolve, reject) => {
    chrome.debugger.attach(debuggee, '1.3', () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })

  return debuggee
}

function sendDebuggerCommand<T = unknown>(
  debuggee: chrome.debugger.Debuggee,
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.debugger.sendCommand(debuggee, method, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve(result as T)
    })
  })
}

async function detachDebugger(debuggee: chrome.debugger.Debuggee): Promise<void> {
  await new Promise<void>((resolve) => {
    chrome.debugger.detach(debuggee, () => resolve())
  })
}

async function evalInPage(debuggee: chrome.debugger.Debuggee, expression: string): Promise<void> {
  try {
    await sendDebuggerCommand(debuggee, 'Runtime.evaluate', {
      expression,
      awaitPromise: false,
      returnByValue: false,
    })
  } catch (error) {
    console.warn('Runtime evaluation failed', error)
  }
}

async function captureVisibleArea(tab: chrome.tabs.Tab): Promise<string> {
  const elapsed = Date.now() - lastCaptureTimestamp
  if (elapsed < CAPTURE_MIN_INTERVAL_MS) {
    await sleep(CAPTURE_MIN_INTERVAL_MS - elapsed)
  }
  return new Promise<string>((resolve, reject) => {
    try {
      const windowId = tab.windowId ?? chrome.windows.WINDOW_ID_CURRENT
      chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message)
          return
        }
        if (!dataUrl) {
          reject('No data URL from captureVisibleTab')
          return
        }
        resolve(dataUrl)
        lastCaptureTimestamp = Date.now()
      })
    } catch (e) {
      reject(e)
    }
  })
}

async function captureFullPage(tab: chrome.tabs.Tab): Promise<string> {
  if (!tab.id) throw new Error('No active tab found')

  try {
    await ensureContentScript(tab.id)

    const response = await sendMessageToTab<{ success: boolean; error?: string; result?: { dataUrl?: string } }>(
      tab.id,
      { type: 'CAPTURE_FULL_PAGE' }
    )
    if (!response?.success) {
      throw new Error(response?.error || 'Full page capture failed')
    }

    const dataUrl = response.result?.dataUrl
    if (!dataUrl) {
      throw new Error('No capture data returned from full page capture')
    }

    return dataUrl
  } catch (error) {
    console.error('Full page capture failed:', error)
    return await captureVisibleArea(tab)
  }
}

async function captureWithViewport(tab: chrome.tabs.Tab, viewport: ViewportPreset): Promise<string> {
  if (!tab.id) throw new Error('No active tab found')

  let debuggee: chrome.debugger.Debuggee | null = null
  const scrollStyleId = '__beveled_scroll_lock'

  try {
    debuggee = await attachDebugger(tab.id)

    await sendDebuggerCommand(debuggee, 'Page.enable')

    if (viewport.userAgent) {
      await sendDebuggerCommand(debuggee, 'Emulation.setUserAgentOverride', {
        userAgent: viewport.userAgent
      })
    }

    await sendDebuggerCommand(debuggee, 'Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: viewport.isMobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
      positionX: 0,
      positionY: 0,
      screenOrientation:
        viewport.width > viewport.height
          ? { type: 'landscapePrimary', angle: 90 }
          : { type: 'portraitPrimary', angle: 0 }
    })

    await sendDebuggerCommand(debuggee, 'Emulation.setVisibleSize', {
      width: viewport.width,
      height: viewport.height,
    }).catch(() => undefined)

    await sendDebuggerCommand(debuggee, 'Emulation.forceViewport', {
      x: 0,
      y: 0,
      scale: 1,
    }).catch(() => undefined)

    if (viewport.isMobile) {
      await sendDebuggerCommand(debuggee, 'Emulation.setTouchEmulationEnabled', {
        enabled: true
      })
    }

    await focusTab(tab)
    await sleep(400)

    await evalInPage(debuggee, 'window.scrollTo({ top: 0, left: 0, behavior: "instant" })')
    await evalInPage(debuggee, `(() => {
      const id = '${scrollStyleId}';
      if (document.getElementById(id)) return;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = 'html,body{overflow:hidden!important;overscroll-behavior:none!important;}::-webkit-scrollbar{display:none!important;}';
      document.head.appendChild(style);
    })();`)
    await evalInPage(debuggee, 'window.dispatchEvent(new Event("resize"))')
    await sleep(220)

    const layoutMetrics = await sendDebuggerCommand<{
      contentSize: { width: number; height: number }
      layoutViewport: { clientWidth: number; clientHeight: number }
    }>(debuggee, 'Page.getLayoutMetrics')

    const clipWidth = Math.max(1, Math.min(viewport.width, Math.floor(layoutMetrics.layoutViewport.clientWidth || viewport.width)))
    const contentHeight = Math.floor(layoutMetrics.contentSize.height || viewport.height)
    const clipHeight = Math.max(1, Math.min(contentHeight, viewport.height))

    const screenshot = await sendDebuggerCommand<{ data: string }>(debuggee, 'Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      fromSurface: true,
      captureBeyondViewport: clipHeight > viewport.height,
      clip: {
        x: 0,
        y: 0,
        width: clipWidth,
        height: clipHeight,
        scale: 1
      }
    })

    return `data:image/png;base64,${screenshot.data}`
  } finally {
    if (debuggee) {
      try {
        await sendDebuggerCommand(debuggee, 'Emulation.clearDeviceMetricsOverride')
      } catch {
        // Ignore cleanup errors
      }

      if (viewport.isMobile) {
        try {
          await sendDebuggerCommand(debuggee, 'Emulation.setTouchEmulationEnabled', { enabled: false })
        } catch {
          // Ignore cleanup errors
        }
      }

      try {
        await evalInPage(debuggee, `(() => {
          const style = document.getElementById('${scrollStyleId}');
          if (style) style.remove();
        })();`)
      } catch {
        // Ignore cleanup errors
      }

      try {
        await detachDebugger(debuggee)
      } catch {
        // Ignore detach errors
      }
    }
  }
}

async function captureAndOpenEditor(options: CaptureOptions = { type: 'visible' }, sender?: chrome.runtime.MessageSender) {
  const tab = await getCaptureTab(sender)
  if (!tab.id) throw new Error('Active tab is not capturable')

  let dataUrl: string

  switch (options.type) {
    case 'visible':
      dataUrl = await captureVisibleArea(tab)
      break
    case 'fullpage':
      dataUrl = await captureFullPage(tab)
      break
    case 'viewport': {
      if (!options.viewport) {
        throw new Error('Viewport options required for viewport capture')
      }
      const preset: ViewportPreset = {
        name: 'Custom',
        width: options.viewport.width,
        height: options.viewport.height,
        deviceScaleFactor: options.viewport.deviceScaleFactor || 1,
        isMobile: options.viewport.isMobile || false
      }
      dataUrl = await captureWithViewport(tab, preset)
      break
    }
    default:
      throw new Error(`Unsupported capture type: ${options.type}`)
  }

  await chrome.storage.local.set({ 
    latestCapture: dataUrl,
    captureOptions: options
  })

  await chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') })
}

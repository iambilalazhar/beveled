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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CAPTURE_SCREENSHOT') {
    const options: CaptureOptions = message.options || { type: 'visible' }
    captureAndOpenEditor(options).then(() => sendResponse({ ok: true })).catch((err) => {
      console.error('Capture failed', err)
      sendResponse({ ok: false, error: String(err) })
    })
    // Keep the message channel open for async response
    return true
  }
})

async function captureVisibleArea(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
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
}

async function captureFullPage(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab.id) throw new Error('No active tab found')

  try {
    // Inject content script if not already present
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-script.js']
    })

    // Get page dimensions first
    const dimensionsResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const body = document.body
        const html = document.documentElement
        
        return {
          fullHeight: Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
          ),
          fullWidth: Math.max(
            body.scrollWidth,
            body.offsetWidth,
            html.clientWidth,
            html.scrollWidth,
            html.offsetWidth
          ),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          originalScrollX: window.scrollX,
          originalScrollY: window.scrollY
        }
      }
    })

    if (!dimensionsResult[0]?.result) {
      throw new Error('Failed to get page dimensions')
    }

    const { fullHeight, fullWidth, viewportHeight, viewportWidth, originalScrollX, originalScrollY } = dimensionsResult[0].result

    // Create canvas for stitching segments
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create canvas context')

    canvas.width = fullWidth
    canvas.height = fullHeight

    // Calculate segments needed
    const verticalSegments = Math.ceil(fullHeight / viewportHeight)
    const horizontalSegments = Math.ceil(fullWidth / viewportWidth)

    // Capture segments
    for (let row = 0; row < verticalSegments; row++) {
      for (let col = 0; col < horizontalSegments; col++) {
        const x = col * viewportWidth
        const y = row * viewportHeight

        // Scroll to position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (scrollX: number, scrollY: number) => {
            window.scrollTo(scrollX, scrollY)
            return new Promise(resolve => setTimeout(resolve, 300)) // Wait for scroll
          },
          args: [x, y]
        })

        // Capture visible area
        const segmentDataUrl = await captureVisibleArea()
        
        // Draw segment to canvas
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, x, y)
            resolve()
          }
          img.onerror = () => reject(new Error('Failed to load segment'))
          img.src = segmentDataUrl
        })
      }
    }

    // Restore original scroll position
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (scrollX: number, scrollY: number) => {
        window.scrollTo(scrollX, scrollY)
      },
      args: [originalScrollX, originalScrollY]
    })

    // Return final stitched image
    return canvas.toDataURL('image/png')

  } catch (error) {
    console.error('Full page capture failed:', error)
    // Fallback to visible area
    return await captureVisibleArea()
  }
}

async function captureWithViewport(viewport: ViewportPreset): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab.id) throw new Error('No active tab found')

  // Store original viewport
  const originalViewport = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent
    })
  })

  try {
    // Set viewport size using debugger API (requires additional permissions)
    // For now, we'll use a content script approach
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (vp: ViewportPreset) => {
        // Simulate viewport change
        const meta = document.querySelector('meta[name="viewport"]') || document.createElement('meta')
        meta.setAttribute('name', 'viewport')
        meta.setAttribute('content', `width=${vp.width}, initial-scale=${1/vp.deviceScaleFactor}`)
        if (!document.querySelector('meta[name="viewport"]')) {
          document.head.appendChild(meta)
        }

        // Add CSS to simulate device dimensions
        const style = document.createElement('style')
        style.textContent = `
          html, body {
            width: ${vp.width}px !important;
            max-width: ${vp.width}px !important;
          }
        `
        document.head.appendChild(style)

        // Wait for layout to update
        return new Promise(resolve => setTimeout(resolve, 500))
      },
      args: [viewport]
    })

    // Capture after viewport change
    const dataUrl = await captureVisibleArea()
    return dataUrl

  } finally {
    // Restore original viewport (cleanup)
    if (originalViewport[0]?.result) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Remove our injected styles
          const injectedStyles = document.querySelectorAll('style')
          injectedStyles.forEach(style => {
            if (style.textContent?.includes('max-width') && style.textContent?.includes('!important')) {
              style.remove()
            }
          })
        }
      })
    }
  }
}

async function captureAndOpenEditor(options: CaptureOptions = { type: 'visible' }) {
  let dataUrl: string

  switch (options.type) {
    case 'visible':
      dataUrl = await captureVisibleArea()
      break
    case 'fullpage':
      dataUrl = await captureFullPage()
      break
    case 'viewport':
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
      dataUrl = await captureWithViewport(preset)
      break
    default:
      throw new Error(`Unsupported capture type: ${options.type}`)
  }

  await chrome.storage.local.set({ 
    latestCapture: dataUrl,
    captureOptions: options
  })

  await chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') })
}

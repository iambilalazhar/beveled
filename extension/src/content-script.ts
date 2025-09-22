// Content script for advanced screenshot capture functionality

declare global {
  interface Window {
    __screenshotCleanup?: () => void
  }
}

interface FullPageCaptureResult {
  dataUrl: string
  width: number
  height: number
  segments: number
}

// Full page screenshot capture using scroll and stitch method
export async function captureFullPage(): Promise<FullPageCaptureResult> {
  return new Promise((resolve, reject) => {
    try {
      // Get full page dimensions
      const body = document.body
      const html = document.documentElement
      
      const fullHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )
      
      const fullWidth = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      )

      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Store original scroll position
      const originalScrollX = window.scrollX
      const originalScrollY = window.scrollY
      
      // Calculate segments needed
      const verticalSegments = Math.ceil(fullHeight / viewportHeight)
      const horizontalSegments = Math.ceil(fullWidth / viewportWidth)
      
      // Create canvas for final composition
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      canvas.width = fullWidth
      canvas.height = fullHeight
      
      const totalSegments = verticalSegments * horizontalSegments
      
      // Function to capture a single segment
      const captureSegment = async (x: number, y: number): Promise<void> => {
        return new Promise((segmentResolve, segmentReject) => {
          // Scroll to position
          window.scrollTo(x, y)
          
          // Wait for scroll and any lazy loading
          const attemptCapture = (retryCount = 0) => {
            window.scrollTo(x, y)
            setTimeout(() => {
              chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_SEGMENT' }, (response) => {
                if (response?.dataUrl) {
                  const img = new Image()
                  img.onload = () => {
                    ctx.drawImage(img, x, y)
                    segmentResolve()
                  }
                  img.onerror = () => segmentReject(new Error('Failed to load segment image'))
                  img.src = response.dataUrl
                } else if (response?.error && retryCount < 3) {
                  // Back off if we hit capture limits
                  attemptCapture(retryCount + 1)
                } else {
                  segmentReject(new Error(response?.error || 'Failed to capture segment'))
                }
              })
            }, 500 + retryCount * 300)
          }

          attemptCapture()
        })
      }
      
      // Capture all segments
      const captureAllSegments = async () => {
        for (let y = 0; y < fullHeight; y += viewportHeight) {
          for (let x = 0; x < fullWidth; x += viewportWidth) {
            await captureSegment(x, y)
          }
        }
        
        // Restore original scroll position
        window.scrollTo(originalScrollX, originalScrollY)
        
        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL('image/png')
        
        resolve({
          dataUrl,
          width: fullWidth,
          height: fullHeight,
          segments: totalSegments
        })
      }
      
      captureAllSegments().catch(reject)
      
    } catch (error) {
      reject(error)
    }
  })
}

// Viewport simulation for device-specific captures
export function simulateViewport(width: number, _height: number, deviceScaleFactor: number = 1): void {
  // Create or update viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta')
    viewportMeta.name = 'viewport'
    document.head.appendChild(viewportMeta)
  }
  
  // Store original viewport content
  const originalContent = viewportMeta.content
  
  // Set new viewport
  viewportMeta.content = `width=${width}, initial-scale=${1/deviceScaleFactor}, user-scalable=no`
  
  // Add CSS to enforce dimensions
  const styleId = 'screenshot-viewport-override'
  let style = document.getElementById(styleId) as HTMLStyleElement
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }
  
  style.textContent = `
    html, body {
      width: ${width}px !important;
      max-width: ${width}px !important;
      min-width: ${width}px !important;
      overflow-x: auto !important;
    }
    
    /* Ensure responsive elements adapt */
    @media (max-width: ${width}px) {
      * {
        box-sizing: border-box !important;
      }
    }
  `
  
  // Store cleanup function
  window.__screenshotCleanup = () => {
    if (originalContent) {
      viewportMeta.content = originalContent
    } else {
      viewportMeta.remove()
    }
    style.remove()
  }
}

// Cleanup viewport simulation
export function restoreViewport(): void {
  if (window.__screenshotCleanup) {
    window.__screenshotCleanup()
    delete window.__screenshotCleanup
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'CAPTURE_FULL_PAGE':
      captureFullPage()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }))
      return true // Keep message channel open for async response
      
    case 'SIMULATE_VIEWPORT':
      try {
        simulateViewport(
          message.width,
          message.height,
          message.deviceScaleFactor
        )
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message })
      }
      break
      
    case 'RESTORE_VIEWPORT':
      try {
        restoreViewport()
        sendResponse({ success: true })
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message })
      }
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Auto-inject on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Beveled content script loaded')
  })
} else {
  console.log('Beveled content script loaded')
}

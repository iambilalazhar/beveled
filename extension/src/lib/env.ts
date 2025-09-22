export function isExtensionRuntime(): boolean {
  try {
    // chrome.runtime.id exists only in an installed extension context
    return typeof chrome !== 'undefined' && !!chrome?.runtime && typeof chrome.runtime.id === 'string'
  } catch {
    return false
  }
}

export function getChromeSafe(): typeof chrome | null {
  return isExtensionRuntime() ? chrome : null
}

export function isWebRuntime(): boolean {
  return !isExtensionRuntime()
}



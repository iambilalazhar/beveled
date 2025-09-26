import * as React from "react"
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      setIsMobile(false)
      return
    }

    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    const mql = window.matchMedia(query)

    const update = (matches: boolean) => {
      setIsMobile(matches)
    }

    const onChange = (event: MediaQueryListEvent) => update(event.matches)

    update(mql.matches)

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    // Safari < 14 fallback
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return !!isMobile
}

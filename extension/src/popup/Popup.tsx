import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Camera } from 'lucide-react'

export default function Popup() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCapture = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' })
      if (!res?.ok) throw new Error(res?.error || 'Unknown error')
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[320px] p-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-blue-600" />
              <CardTitle className="text-base">Good Screenshots</CardTitle>
            </div>
            <ThemeToggle />
          </div>
          <CardDescription>
            Capture the current tab and open the editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCapture} disabled={loading} className="w-full">
            {loading ? 'Capturing…' : 'Capture Screenshot'}
          </Button>
          {error && <div className="mt-2 text-red-600">{error}</div>}
          <Separator className="my-3" />
          <p className="text-[11px] text-muted-foreground">
            Tip: Ensure the tab you want is focused before clicking.
          </p>
        </CardContent>
        <CardFooter className="justify-between text-[11px] text-muted-foreground">
          <span>v0.1</span>
          <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer" className="hover:underline">Powered by shadcn/ui</a>
        </CardFooter>
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TextNode } from './types'
import { Settings2 } from 'lucide-react'

export function TemplateProperties({
  texts,
  onChangeText,
}: {
  texts: TextNode[]
  onChangeText: (id: string, patch: Partial<TextNode>) => void
}) {
  const [open, setOpen] = useState(false)
  const tag = useMemo(() => texts.find(t => t.id === 'tag'), [texts])
  const title = useMemo(() => texts.find(t => t.id === 'title'), [texts])
  const subtitle = useMemo(() => texts.find(t => t.id === 'subtitle'), [texts])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 ml-2" title="Template Properties">
          <Settings2 className="mr-2 h-4 w-4" />
          Template
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          {title && (
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title.text} onChange={(e) => onChangeText(title.id, { text: e.currentTarget.value })} />
            </div>
          )}
          {subtitle && (
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={subtitle.text} onChange={(e) => onChangeText(subtitle.id, { text: e.currentTarget.value })} />
            </div>
          )}
          {tag && (
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input value={tag.text} onChange={(e) => onChangeText(tag.id, { text: e.currentTarget.value })} />
            </div>
          )}
          {!title && !subtitle && !tag && (
            <div className="text-sm text-muted-foreground">Current template exposes no editable fields.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

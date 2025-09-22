import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EditorTemplate } from './templates'

export function TemplatesDropdown({
  templates,
  value,
  onChange,
}: {
  templates: EditorTemplate[]
  value: string | null
  onChange: (id: string) => void
}) {
  const [current, setCurrent] = useState<string | null>(value)
  return (
    <div className="ml-4 min-w-56">
      <Select
        value={current ?? ''}
        onValueChange={(v) => { setCurrent(v); onChange(v) }}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Templates" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}


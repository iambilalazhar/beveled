import React, { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'

type LexicalTextProps = {
  value: string
  onChange: (next: string) => void
  className?: string
  style?: CSSProperties
  placeholder?: string
  // When true, prevents newline entry and normalizes newlines to spaces
  singleLine?: boolean
}

function SetValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()
  React.useEffect(() => {
    let needsUpdate = false
    editor.getEditorState().read(() => {
      const root = $getRoot()
      const current = root.getTextContent()
      if (current !== value) needsUpdate = true
    })
    if (!needsUpdate) return
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      paragraph.append($createTextNode(value))
      root.append(paragraph)
    })
  }, [editor, value])
  return null
}

export default function LexicalText({ value, onChange, className, style, placeholder, singleLine = false }: LexicalTextProps) {
  const initialConfig = useMemo(() => ({
    namespace: 'OverlayTextEditor',
    onError(error: unknown) {
      // Bubble up but avoid crashing the whole app
      console.error(error)
    },
    // Keep default theme minimal; styles are applied via ContentEditable props
    theme: {},
  }), [])

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <PlainTextPlugin
        contentEditable={
          <ContentEditable
            data-editable="true"
            className={className}
            style={{ direction: 'ltr', ...style }}
            onKeyDown={(e) => {
              if (singleLine && (e.key === 'Enter' || e.key === 'Return')) {
                e.preventDefault()
              }
            }}
            aria-placeholder={placeholder ?? ''}
            placeholder={() => null}
          />
        }
        placeholder={placeholder ? <div>{placeholder}</div> : <></>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin
        onChange={(editorState) => {
          editorState.read(() => {
            const text = $getRoot().getTextContent()
            if (singleLine) {
              // Normalize any accidental newlines into single spaces
              const normalized = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim()
              if (normalized !== text) {
                onChange(normalized)
                return
              }
            }
            onChange(text)
          })
        }}
      />
      <HistoryPlugin />
      <SetValuePlugin value={value} />
    </LexicalComposer>
  )
}

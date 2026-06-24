import { useState } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  { id: 'python',     label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java',       label: 'Java' },
  { id: 'cpp',        label: 'C++' },
  { id: 'go',         label: 'Go' },
  { id: 'typescript', label: 'TypeScript' },
]

export default function CodeEditor({ value, onChange }) {
  const [language, setLanguage] = useState('python')

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
      {/* Language bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10 overflow-x-auto">
        <span className="text-white/30 text-xs shrink-0">Language:</span>
        <div className="flex gap-1">
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors shrink-0 ${
                language === l.id
                  ? 'bg-accent-blue text-white'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monaco editor — loads from CDN, no bundle impact */}
      <Editor
        height="320px"
        language={language}
        value={value}
        onChange={v => onChange(v || '')}
        theme="vs-dark"
        loading={
          <div className="flex items-center justify-center h-[320px] text-white/30 text-sm">
            Loading editor…
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          padding: { top: 12, bottom: 12 },
          suggest: { enabled: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
          hover: { enabled: false },
          renderLineHighlight: 'line',
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
        }}
      />
    </div>
  )
}

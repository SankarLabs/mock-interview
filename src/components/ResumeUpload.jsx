import React, { useRef, useState } from 'react'

export default function ResumeUpload({ onUpload, isLoading }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(file) {
    setError(null)
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Max 10MB.')
      return
    }
    setFileName(file.name)
    onUpload(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="w-full">
      <div
        onClick={() => !isLoading && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging ? 'border-accent-blue bg-accent-blue/10 scale-[1.01]' : 'border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/8'}
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={isLoading}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-white/60 text-sm">Parsing resume…</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📄</div>
            <p className="font-medium text-white">{fileName}</p>
            <p className="text-white/50 text-sm">Click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center text-2xl">↑</div>
            <div>
              <p className="font-semibold text-white">Drop your resume here</p>
              <p className="text-white/50 text-sm mt-1">or click to browse — PDF only</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
    </div>
  )
}

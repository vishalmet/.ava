"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Download, ExternalLink } from "lucide-react"
import SyntaxHighlighter from "./syntax-highlighter"
import PopupEditor from "./popup-editor"

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language: "ava" | "sol" | "cairo" | "rs"
  placeholder?: string
  readOnly?: boolean
  title: string
  badge: string
  onCopy?: () => void
  onDownload?: () => void
  downloadExtension?: string
}

export default function CodeEditor({
  value,
  onChange,
  language,
  placeholder = "",
  readOnly = false,
  title,
  badge,
  onCopy,
  onDownload,
  downloadExtension
}: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
    setScrollLeft(e.currentTarget.scrollLeft)
  }

  const handleFocus = () => {
    if (!readOnly) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    if (onCopy) onCopy()
  }

  const handleDownload = () => {
    if (onDownload) onDownload()
  }

  const handleOpenPopup = () => {
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              language === 'ava' 
                ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                : language === 'sol'
                ? 'bg-blue-500'
                : language === 'cairo'
                ? 'bg-purple-500'
                : 'bg-orange-600'
            }`}
          />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-neutral-100 rounded-md font-medium">
            {badge}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleOpenPopup} title="Open in popup">
              <ExternalLink className="h-4 w-4" />
            </Button>
            {value && (
              <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {value && onDownload && (
              <Button variant="ghost" size="sm" onClick={handleDownload} title="Download code">
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative border rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
        {isEditing && !readOnly ? (
          // Show regular textarea when editing
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full h-96 p-4 font-mono text-sm text-white bg-transparent border-0 outline-none resize-none"
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            style={{
              lineHeight: '1.5',
              tabSize: 2,
              caretColor: '#00ff00', // Bright green cursor for visibility
              backgroundColor: '#1e1e1e',
            }}
          />
        ) : (
          // Show syntax highlighted version when not editing
          <div className="relative">
            {value ? (
              <SyntaxHighlighter 
                code={value} 
                language={language}
                className="h-96 resize-none border-0"
              />
            ) : (
              <div className="h-96 p-4 flex items-center justify-center text-neutral-400 font-mono text-sm">
                {placeholder}
              </div>
            )}
            
            {/* Invisible textarea for click detection */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onFocus={handleFocus}
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent border-0 outline-none resize-none text-transparent"
              readOnly={readOnly}
              spellCheck={false}
              style={{
                lineHeight: '1.5',
                tabSize: 2,
              }}
            />
          </div>
        )}
      </div>

      {/* Popup Editor */}
      <PopupEditor
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        value={value}
        onChange={onChange}
        language={language}
        title={title}
        readOnly={readOnly}
        onCopy={handleCopy}
        onDownload={onDownload ? handleDownload : undefined}
      />
    </div>
  )
}

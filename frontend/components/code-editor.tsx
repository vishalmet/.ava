"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Download, ExternalLink, Check } from "lucide-react"
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
  showLanguageSelector?: boolean
  languageOptions?: Array<{ value: string; label: string; extension: string }>
  onLanguageChange?: (language: string) => void
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
  downloadExtension,
  showLanguageSelector = false,
  languageOptions = [],
  onLanguageChange
}: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
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
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
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
          {showLanguageSelector && languageOptions.length > 0 && (
            <Select value={language} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <span className="text-xs px-2 py-1 bg-neutral-100 rounded-md font-medium">
            {badge}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleOpenPopup} title="Open in popup">
              <ExternalLink className="h-4 w-4" />
            </Button>
            {value && (
              <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy code" className="relative">
                {showCopied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  </>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
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
        {/* Syntax highlighted background - always visible */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(-${scrollLeft}px, -${scrollTop}px)`,
            overflow: 'visible',
          }}
        >
          {value && (
            <SyntaxHighlighter 
              code={value} 
              language={language}
              className="h-96 resize-none border-0 bg-transparent"
            />
          )}
        </div>

        {/* Transparent textarea for editing */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextareaChange}
          onScroll={handleScroll}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="relative w-full h-96 p-4 font-mono text-sm bg-transparent border-0 outline-none resize-none"
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          style={{
            lineHeight: '1.5',
            tabSize: 2,
            color: 'transparent',
            caretColor: '#00ff00',
            WebkitTextFillColor: 'transparent',
            zIndex: 1,
          }}
        />

        {/* Placeholder when empty */}
        {!value && (
          <div className="absolute top-4 left-4 text-neutral-400 font-mono text-sm pointer-events-none">
            {readOnly ? "No content found" : placeholder}
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

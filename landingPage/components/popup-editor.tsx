"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Copy, Download } from "lucide-react"
import SyntaxHighlighter from "./syntax-highlighter"
import CodeSuggestions from "./code-suggestions"

interface PopupEditorProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange?: (value: string) => void
  language: "ava" | "sol" | "cairo" | "rs"
  title: string
  readOnly?: boolean
  onCopy?: () => void
  onDownload?: () => void
}

export default function PopupEditor({
  isOpen,
  onClose,
  value,
  onChange,
  language,
  title,
  readOnly = false,
  onCopy,
  onDownload
}: PopupEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [suggestionPosition, setSuggestionPosition] = useState({ x: 0, y: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
    setCursorPosition(e.target.selectionStart)
    
    // Show suggestions when typing if not read-only
    if (!readOnly) {
      const shouldShowSuggestions = e.target.value.length > 0
      setShowSuggestions(shouldShowSuggestions)
      
      if (shouldShowSuggestions) {
        updateSuggestionPosition()
      }
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
    // Don't immediately hide suggestions, let them handle their own hiding
  }

  const updateSuggestionPosition = () => {
    if (!textareaRef.current || !editorRef.current) return
    
    const textarea = textareaRef.current
    const rect = textarea.getBoundingClientRect()
    
    // Simple positioning - place suggestions near cursor
    setSuggestionPosition({
      x: rect.left + 20,
      y: rect.top + 100
    })
  }

  const handleSuggestionSelect = (suggestion: any) => {
    if (!onChange || !textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // Get the word being replaced
    const textBefore = value.substring(0, start)
    const textAfter = value.substring(end)
    const words = textBefore.split(/\s+/)
    const currentWord = words[words.length - 1] || ''
    
    // Replace the current word with the suggestion
    const newTextBefore = textBefore.substring(0, textBefore.length - currentWord.length)
    const newValue = newTextBefore + suggestion.insertText + textAfter
    
    onChange(newValue)
    setShowSuggestions(false)
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = newTextBefore.length + suggestion.insertText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl+Space to trigger suggestions
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault()
      setShowSuggestions(true)
      updateSuggestionPosition()
      return
    }
    
    // Update cursor position on arrow keys
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      setTimeout(() => {
        if (textareaRef.current) {
          setCursorPosition(textareaRef.current.selectionStart)
        }
      }, 0)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    if (onCopy) onCopy()
  }

  const handleDownload = () => {
    if (onDownload) onDownload()
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ width: '80vw', height: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-neutral-50">
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
                <h2 className="font-semibold text-lg">{title}</h2>
              </div>
              
              <div className="flex items-center gap-2">
                {value && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    {onDownload && (
                      <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div ref={editorRef} className="relative flex-1 overflow-hidden" style={{ height: 'calc(80vh - 73px)', backgroundColor: '#1e1e1e' }}>
              {isEditing && !readOnly ? (
                // Show regular textarea when editing
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleTextareaChange}
                  onScroll={handleScroll}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full p-4 font-mono text-sm text-white bg-transparent border-0 outline-none resize-none"
                  placeholder={readOnly ? "No content to display" : "Enter your code here... (Ctrl+Space for suggestions)"}
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
                <div className="relative w-full h-full">
                  {value ? (
                    <SyntaxHighlighter 
                      code={value} 
                      language={language}
                      className="w-full h-full resize-none border-0"
                    />
                  ) : (
                    <div className="w-full h-full p-4 flex items-center justify-center text-neutral-400 font-mono text-sm">
                      {readOnly ? "No content to display" : "Enter your code here... (Ctrl+Space for suggestions)"}
                    </div>
                  )}
                  
                  {/* Invisible textarea for click detection */}
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleTextareaChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
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
          </motion.div>

          {/* Code Suggestions */}
          <CodeSuggestions
            value={value}
            cursorPosition={cursorPosition}
            language={language}
            onSuggestionSelect={handleSuggestionSelect}
            isVisible={showSuggestions && !readOnly}
            position={suggestionPosition}
          />
        </div>
      )}
    </AnimatePresence>
  )
}

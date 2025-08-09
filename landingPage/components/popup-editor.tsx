"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Copy, Download } from "lucide-react"
import SyntaxHighlighter from "./syntax-highlighter"

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
            <div className="relative flex-1 overflow-hidden" style={{ height: 'calc(80vh - 73px)' }}>
              {/* Dark background */}
              <div 
                className="absolute inset-0 -z-10"
                style={{ backgroundColor: '#1e1e1e' }}
              />

              {/* Syntax highlighted background - always show */}
              <div 
                className="absolute inset-0 pointer-events-none overflow-hidden"
                style={{
                  transform: `translate(-${scrollLeft}px, -${scrollTop}px)`,
                }}
              >
                {value && (
                  <SyntaxHighlighter 
                    code={value} 
                    language={language}
                    className="w-full h-full resize-none border-0 bg-transparent"
                  />
                )}
              </div>

              {/* Textarea for editing - always transparent */}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onScroll={handleScroll}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`
                  w-full h-full p-4 font-mono text-sm resize-none border-0 outline-none
                  bg-transparent text-transparent caret-white
                  ${readOnly ? 'cursor-default' : 'cursor-text'}
                `}
                placeholder={readOnly ? "No content to display" : "Enter your code here..."}
                readOnly={readOnly}
                spellCheck={false}
                style={{
                  lineHeight: '1.5',
                  tabSize: 2,
                }}
              />

              {/* Fallback for read-only without syntax highlighting */}
              {readOnly && !value && (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-400 pointer-events-none">
                  No content to display
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

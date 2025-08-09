"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Suggestion {
  label: string
  kind: 'keyword' | 'function' | 'variable' | 'type' | 'snippet'
  detail?: string
  insertText: string
  description?: string
}

interface CodeSuggestionsProps {
  value: string
  cursorPosition: number
  language: "ava" | "sol" | "cairo" | "rs"
  onSuggestionSelect: (suggestion: Suggestion) => void
  isVisible: boolean
  position: { x: number; y: number }
}

const suggestions = {
  ava: [
    { label: 'function', kind: 'keyword' as const, detail: 'Function declaration', insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', description: 'Create a new function' },
    { label: 'require', kind: 'function' as const, detail: 'Require statement', insertText: 'require(${1:condition}, "${2:message}");', description: 'Add a requirement check' },
    { label: 'emit', kind: 'function' as const, detail: 'Emit event', insertText: 'emit ${1:EventName}(${2:params});', description: 'Emit an event' },
    { label: 'return', kind: 'keyword' as const, detail: 'Return statement', insertText: 'return ${1:value};', description: 'Return a value' },
    { label: 'address', kind: 'type' as const, detail: 'Address type', insertText: 'address', description: 'Avalanche address type' },
    { label: 'u64', kind: 'type' as const, detail: 'Unsigned 64-bit integer', insertText: 'u64', description: '64-bit unsigned integer' },
    { label: 'u32', kind: 'type' as const, detail: 'Unsigned 32-bit integer', insertText: 'u32', description: '32-bit unsigned integer' },
    { label: 'bool', kind: 'type' as const, detail: 'Boolean type', insertText: 'bool', description: 'Boolean true/false' },
    { label: 'string', kind: 'type' as const, detail: 'String type', insertText: 'string', description: 'Text string' },
    { label: 'if', kind: 'keyword' as const, detail: 'If statement', insertText: 'if (${1:condition}) {\n\t$0\n}', description: 'Conditional statement' },
    { label: 'for', kind: 'keyword' as const, detail: 'For loop', insertText: 'for (${1:init}; ${2:condition}; ${3:increment}) {\n\t$0\n}', description: 'For loop' },
    { label: 'while', kind: 'keyword' as const, detail: 'While loop', insertText: 'while (${1:condition}) {\n\t$0\n}', description: 'While loop' },
  ],
  sol: [
    { label: 'pragma', kind: 'keyword' as const, detail: 'Pragma directive', insertText: 'pragma solidity ^0.8.0;', description: 'Solidity version pragma' },
    { label: 'contract', kind: 'keyword' as const, detail: 'Contract declaration', insertText: 'contract ${1:ContractName} {\n\t$0\n}', description: 'Create a new contract' },
    { label: 'function', kind: 'keyword' as const, detail: 'Function declaration', insertText: 'function ${1:name}(${2:params}) ${3:visibility} ${4:returns} {\n\t$0\n}', description: 'Create a function' },
    { label: 'mapping', kind: 'type' as const, detail: 'Mapping type', insertText: 'mapping(${1:keyType} => ${2:valueType})', description: 'Key-value mapping' },
    { label: 'uint256', kind: 'type' as const, detail: '256-bit unsigned integer', insertText: 'uint256', description: '256-bit unsigned integer' },
    { label: 'address', kind: 'type' as const, detail: 'Ethereum address', insertText: 'address', description: 'Ethereum address type' },
    { label: 'require', kind: 'function' as const, detail: 'Require statement', insertText: 'require(${1:condition}, "${2:message}");', description: 'Requirement check' },
    { label: 'emit', kind: 'function' as const, detail: 'Emit event', insertText: 'emit ${1:EventName}(${2:params});', description: 'Emit an event' },
    { label: 'public', kind: 'keyword' as const, detail: 'Public visibility', insertText: 'public', description: 'Public function/variable' },
    { label: 'private', kind: 'keyword' as const, detail: 'Private visibility', insertText: 'private', description: 'Private function/variable' },
    { label: 'view', kind: 'keyword' as const, detail: 'View function', insertText: 'view', description: 'Read-only function' },
    { label: 'pure', kind: 'keyword' as const, detail: 'Pure function', insertText: 'pure', description: 'No state access function' },
  ],
  cairo: [
    { label: '%lang', kind: 'keyword' as const, detail: 'Language directive', insertText: '%lang starknet', description: 'StarkNet language directive' },
    { label: 'func', kind: 'keyword' as const, detail: 'Function declaration', insertText: 'func ${1:name}{${2:implicit_args}}(${3:params}) -> (${4:returns}) {\n\t$0\n}', description: 'Create a function' },
    { label: 'felt', kind: 'type' as const, detail: 'Field element', insertText: 'felt', description: 'Cairo field element type' },
    { label: 'let', kind: 'keyword' as const, detail: 'Variable declaration', insertText: 'let ${1:name} = ${2:value};', description: 'Declare a variable' },
    { label: 'storage_var', kind: 'function' as const, detail: 'Storage variable', insertText: '@storage_var\nfunc ${1:name}() -> (res: felt) {\n}', description: 'Define storage variable' },
    { label: 'external', kind: 'keyword' as const, detail: 'External function', insertText: '@external', description: 'External function decorator' },
    { label: 'view', kind: 'keyword' as const, detail: 'View function', insertText: '@view', description: 'View function decorator' },
    { label: 'event', kind: 'keyword' as const, detail: 'Event declaration', insertText: '@event\nfunc ${1:EventName}(${2:params}) {\n}', description: 'Define an event' },
    { label: 'assert', kind: 'function' as const, detail: 'Assertion', insertText: 'assert ${1:condition};', description: 'Assert condition' },
    { label: 'return', kind: 'keyword' as const, detail: 'Return statement', insertText: 'return (${1:values});', description: 'Return values' },
  ],
  rs: [
    { label: 'fn', kind: 'keyword' as const, detail: 'Function declaration', insertText: 'fn ${1:name}(${2:params}) ${3:-> ReturnType} {\n\t$0\n}', description: 'Create a function' },
    { label: 'let', kind: 'keyword' as const, detail: 'Variable declaration', insertText: 'let ${1:name} = ${2:value};', description: 'Declare an immutable variable' },
    { label: 'mut', kind: 'keyword' as const, detail: 'Mutable variable', insertText: 'let mut ${1:name} = ${2:value};', description: 'Declare a mutable variable' },
    { label: 'struct', kind: 'keyword' as const, detail: 'Struct declaration', insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}', description: 'Define a struct' },
    { label: 'impl', kind: 'keyword' as const, detail: 'Implementation block', insertText: 'impl ${1:Type} {\n\t$0\n}', description: 'Implementation block' },
    { label: 'pub', kind: 'keyword' as const, detail: 'Public visibility', insertText: 'pub', description: 'Make item public' },
    { label: 'String', kind: 'type' as const, detail: 'String type', insertText: 'String', description: 'Owned string type' },
    { label: 'Vec', kind: 'type' as const, detail: 'Vector type', insertText: 'Vec<${1:T}>', description: 'Dynamic array' },
    { label: 'HashMap', kind: 'type' as const, detail: 'HashMap type', insertText: 'HashMap<${1:K}, ${2:V}>', description: 'Hash map collection' },
    { label: 'Result', kind: 'type' as const, detail: 'Result type', insertText: 'Result<${1:T}, ${2:E}>', description: 'Result type for error handling' },
    { label: 'Option', kind: 'type' as const, detail: 'Option type', insertText: 'Option<${1:T}>', description: 'Optional value type' },
    { label: 'match', kind: 'keyword' as const, detail: 'Match expression', insertText: 'match ${1:expr} {\n\t${2:pattern} => ${3:result},\n\t_ => ${4:default},\n}', description: 'Pattern matching' },
  ]
}

const kindIcons = {
  keyword: '🔤',
  function: '⚡',
  variable: '📦',
  type: '🏷️',
  snippet: '📝'
}

const kindColors = {
  keyword: '#569cd6',
  function: '#dcdcaa',
  variable: '#9cdcfe',
  type: '#4ec9b0',
  snippet: '#ce9178'
}

export default function CodeSuggestions({
  value,
  cursorPosition,
  language,
  onSuggestionSelect,
  isVisible,
  position
}: CodeSuggestionsProps) {
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible) return

    // Get the word being typed at cursor position
    const textBeforeCursor = value.substring(0, cursorPosition)
    const words = textBeforeCursor.split(/\s+/)
    const currentWord = words[words.length - 1] || ''

    // Filter suggestions based on current word
    const filtered = suggestions[language].filter(suggestion =>
      suggestion.label.toLowerCase().startsWith(currentWord.toLowerCase())
    )

    setFilteredSuggestions(filtered)
    setSelectedIndex(0)
  }, [value, cursorPosition, language, isVisible])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredSuggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev === 0 ? filteredSuggestions.length - 1 : prev - 1)
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          if (filteredSuggestions[selectedIndex]) {
            onSuggestionSelect(filteredSuggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          // Close suggestions (handled by parent)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, filteredSuggestions, selectedIndex, onSuggestionSelect])

  if (!isVisible || filteredSuggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-2xl overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          minWidth: '300px',
          maxWidth: '400px',
          maxHeight: '300px'
        }}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className="overflow-y-auto max-h-80">
          {filteredSuggestions.map((suggestion, index) => (
            <motion.div
              key={`${suggestion.label}-${index}`}
              className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                index === selectedIndex ? 'bg-blue-600' : 'hover:bg-neutral-700'
              }`}
              onClick={() => onSuggestionSelect(suggestion)}
              whileHover={{ backgroundColor: index === selectedIndex ? '#2563eb' : '#404040' }}
            >
              <span className="text-lg">{kindIcons[suggestion.kind]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span 
                    className="font-medium text-sm"
                    style={{ color: kindColors[suggestion.kind] }}
                  >
                    {suggestion.label}
                  </span>
                  {suggestion.detail && (
                    <span className="text-xs text-neutral-400 truncate">
                      {suggestion.detail}
                    </span>
                  )}
                </div>
                {suggestion.description && (
                  <div className="text-xs text-neutral-300 mt-1 truncate">
                    {suggestion.description}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

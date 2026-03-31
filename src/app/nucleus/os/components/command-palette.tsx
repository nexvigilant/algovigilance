'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Command, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { OS_TOOLS, type OSTool } from './os-config'
import { useHardwareCapabilities } from '@/lib/observatory/use-hardware-capabilities'

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { tier } = useHardwareCapabilities()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const filteredTools = useMemo(() => {
    if (!query) return OS_TOOLS.slice(0, 5)
    return OS_TOOLS.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.tags.some(tag => tag.includes(query.toLowerCase()))
    ).slice(0, 8)
  }, [query])

  useEffect(() => { setSelectedIndex(0) }, [query])

  const handleSelect = useCallback((tool: OSTool) => {
    router.push(tool.href)
    setIsOpen(false)
    setQuery('')
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filteredTools.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filteredTools.length) % filteredTools.length)
    } else if (e.key === 'Enter') {
      if (filteredTools[selectedIndex]) {
        handleSelect(filteredTools[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#1E2430] border border-white/10 shadow-2xl overflow-hidden rounded-lg"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="h-4 w-4 text-[#a8b2d1]/50 mr-3" />
          <input 
            autoFocus
            placeholder="Type a command or search tools..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none font-mono text-sm"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-[#a8b2d1]/50 font-mono">
            <Command className="h-2.5 w-2.5" /> K
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredTools.map((tool, i) => (
            <button
              key={tool.id}
              onClick={() => handleSelect(tool)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                i === selectedIndex ? 'bg-cyan/10 border-l-2 border-[#7B95B5] text-[#7B95B5]' : 'hover:bg-white/5 text-[#a8b2d1]/70'
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <tool.icon className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">
                  {tool.title}
                  {tool.tags.includes('3d') && tier === 'low' && (
                    <span className="ml-2 text-[8px] text-ember/80 border border-ember/30 px-1.5 py-0 rounded">High Intensity</span>
                  )}
                </div>
                <div className="text-[10px] text-[#a8b2d1]/60 truncate">{tool.description}</div>
              </div>
              <ChevronRight className="h-3 w-3 opacity-20" />
            </button>
          ))}
          {filteredTools.length === 0 && (
            <div className="py-8 text-center text-[#a8b2d1]/40 font-mono text-xs">
              No matching tools found
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-[9px] font-mono text-[#a8b2d1]/40 uppercase tracking-widest">
          <span>Arrow keys to navigate • Enter to select</span>
          <span>Esc to close</span>
        </div>
      </motion.div>
    </div>
  )
}

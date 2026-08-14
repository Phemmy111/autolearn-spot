"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, Unlock, Eye, EyeOff, Layers, AlignLeft, AlignCenter, AlignRight, Move, RotateCw, Trash2, Save, Loader2, Undo, Redo, Copy, Clipboard } from 'lucide-react'
import { CertificateLayout, CertificateElement, validateLayout, cloneLayout, resetToDefault, getElementText, getElementSrc, DEMO_CERTIFICATE_DATA } from '@/lib/certificate-layout'

interface CertificateDesignerProps {
  layout: CertificateLayout
  onLayoutChange: (layout: CertificateLayout) => void
  settings: Record<string, string>
  readOnly?: boolean
  onSave?: (e: React.FormEvent) => void
  isSaving?: boolean
}

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800
const SCALE = 0.4 // Scale down for admin UI

export function CertificateDesigner({ layout, onLayoutChange, settings, readOnly = false, onSave, isSaving = false }: CertificateDesignerProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [history, setHistory] = useState<CertificateLayout[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [clipboard, setClipboard] = useState<CertificateElement | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Track unsaved changes and manage history
  useEffect(() => {
    setUnsavedChanges(true)
    
    // Add to history for undo/redo
    const validation = validateLayout(layout)
    if (validation.valid) {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(layout)
        // Keep only last 50 states
        if (newHistory.length > 50) {
          newHistory.shift()
        }
        return newHistory
      })
      setHistoryIndex(prev => Math.min(prev + 1, 49))
    }
  }, [layout])

  // Initialize history with current layout
  useEffect(() => {
    const validation = validateLayout(layout)
    if (validation.valid && history.length === 0) {
      setHistory([layout])
      setHistoryIndex(0)
    }
  }, [])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CertificateElement) => {
    if (readOnly || element.locked) return

    e.stopPropagation()
    
    // Handle multi-select with Shift+click
    if (e.shiftKey) {
      if (selectedElements.includes(element.id)) {
        setSelectedElements(prev => prev.filter(id => id !== element.id))
        if (selectedElement === element.id && selectedElements.length > 1) {
          setSelectedElement(selectedElements.find(id => id !== element.id) || null)
        }
      } else {
        setSelectedElements(prev => [...prev, element.id])
        setSelectedElement(element.id)
      }
    } else {
      setSelectedElement(element.id)
      setSelectedElements([element.id])
    }
    
    setIsDragging(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scale = SCALE

    setDragOffset({
      x: (e.clientX - rect.left) / scale - element.x,
      y: (e.clientY - rect.top) / scale - element.y
    })
  }, [readOnly, selectedElements, selectedElement])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || readOnly) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scale = SCALE

    const newX = (e.clientX - rect.left) / scale - dragOffset.x
    const newY = (e.clientY - rect.top) / scale - dragOffset.y

    const element = layout.elements.find(el => el.id === selectedElement)
    if (!element) return

    // Constrain to canvas bounds
    const constrainedX = Math.max(0, Math.min(newX, CANVAS_WIDTH - element.width))
    const constrainedY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - element.height))

    const updatedLayout = cloneLayout(layout)
    const updatedElement = updatedLayout.elements.find(el => el.id === selectedElement)
    if (updatedElement) {
      updatedElement.x = constrainedX
      updatedElement.y = constrainedY
      onLayoutChange(updatedLayout)
    }
  }, [isDragging, selectedElement, dragOffset, layout, onLayoutChange, readOnly])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSelectElement = useCallback((elementId: string) => {
    setSelectedElement(elementId)
  }, [])

  const handleToggleVisible = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(layout)
    const element = updatedLayout.elements.find(el => el.id === elementId)
    if (element) {
      element.visible = !element.visible
      onLayoutChange(updatedLayout)
    }
  }, [layout, onLayoutChange])

  const handleToggleLock = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(layout)
    const element = updatedLayout.elements.find(el => el.id === elementId)
    if (element) {
      element.locked = !element.locked
      onLayoutChange(updatedLayout)
    }
  }, [layout, onLayoutChange])

  const handleStyleChange = useCallback((property: string, value: any) => {
    if (!selectedElement) return

    const updatedLayout = cloneLayout(layout)
    const element = updatedLayout.elements.find(el => el.id === selectedElement)
    if (element) {
      if (!element.style) {
        element.style = {}
      }
      element.style[property] = value
      onLayoutChange(updatedLayout)
    }
  }, [selectedElement, layout, onLayoutChange])

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset the layout to default? This will reset all element positions and styles.')) {
      onLayoutChange(resetToDefault())
      setSelectedElement(null)
    }
  }, [onLayoutChange])

  const handleDeleteElement = useCallback((elementId: string) => {
    if (confirm('Are you sure you want to delete this element?')) {
      const updatedLayout = cloneLayout(layout)
      updatedLayout.elements = updatedLayout.elements.filter(el => el.id !== elementId)
      onLayoutChange(updatedLayout)
      if (selectedElement === elementId) {
        setSelectedElement(null)
      }
      if (selectedElements.includes(elementId)) {
        setSelectedElements(prev => prev.filter(id => id !== elementId))
      }
    }
  }, [layout, onLayoutChange, selectedElement, selectedElements])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1
      setHistoryIndex(newHistoryIndex)
      onLayoutChange(history[newHistoryIndex])
    }
  }, [history, historyIndex, onLayoutChange])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1
      setHistoryIndex(newHistoryIndex)
      onLayoutChange(history[newHistoryIndex])
    }
  }, [history, historyIndex, onLayoutChange])

  const handleCopy = useCallback(() => {
    if (selectedElement) {
      const element = layout.elements.find(el => el.id === selectedElement)
      if (element) {
        setClipboard(JSON.parse(JSON.stringify(element)))
      }
    }
  }, [selectedElement, layout])

  const handlePaste = useCallback(() => {
    if (clipboard) {
      const updatedLayout = cloneLayout(layout)
      const newElement = JSON.parse(JSON.stringify(clipboard))
      newElement.id = `${clipboard.id}_copy_${Date.now()}`
      newElement.x += 20
      newElement.y += 20
      updatedLayout.elements.push(newElement)
      onLayoutChange(updatedLayout)
      setSelectedElement(newElement.id)
    }
  }, [clipboard, layout, onLayoutChange])

  const handleDuplicate = useCallback(() => {
    if (selectedElement) {
      const element = layout.elements.find(el => el.id === selectedElement)
      if (element) {
        const updatedLayout = cloneLayout(layout)
        const newElement = JSON.parse(JSON.stringify(element))
        newElement.id = `${element.id}_copy_${Date.now()}`
        newElement.x += 20
        newElement.y += 20
        updatedLayout.elements.push(newElement)
        onLayoutChange(updatedLayout)
        setSelectedElement(newElement.id)
      }
    }
  }, [selectedElement, layout, onLayoutChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return

      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) {
          const newHistoryIndex = historyIndex - 1
          setHistoryIndex(newHistoryIndex)
          onLayoutChange(history[newHistoryIndex])
        }
      }
      // Ctrl+Shift+Z or Ctrl+Y for redo
      else if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault()
        if (historyIndex < history.length - 1) {
          const newHistoryIndex = historyIndex + 1
          setHistoryIndex(newHistoryIndex)
          onLayoutChange(history[newHistoryIndex])
        }
      }
      // Delete key
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault()
          handleDeleteElement(selectedElement)
        }
      }
      // Ctrl+C for copy
      else if (e.ctrlKey && e.key === 'c') {
        if (selectedElement && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault()
          const element = layout.elements.find(el => el.id === selectedElement)
          if (element) {
            setClipboard(JSON.parse(JSON.stringify(element)))
          }
        }
      }
      // Ctrl+V for paste
      else if (e.ctrlKey && e.key === 'v') {
        if (clipboard && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault()
          const updatedLayout = cloneLayout(layout)
          const newElement = JSON.parse(JSON.stringify(clipboard))
          newElement.id = `${clipboard.id}_copy_${Date.now()}`
          newElement.x += 20
          newElement.y += 20
          updatedLayout.elements.push(newElement)
          onLayoutChange(updatedLayout)
          setSelectedElement(newElement.id)
        }
      }
      // Ctrl+D for duplicate
      else if (e.ctrlKey && e.key === 'd') {
        if (selectedElement && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault()
          const element = layout.elements.find(el => el.id === selectedElement)
          if (element) {
            const updatedLayout = cloneLayout(layout)
            const newElement = JSON.parse(JSON.stringify(element))
            newElement.id = `${element.id}_copy_${Date.now()}`
            newElement.x += 20
            newElement.y += 20
            updatedLayout.elements.push(newElement)
            onLayoutChange(updatedLayout)
            setSelectedElement(newElement.id)
          }
        }
      }
      // Arrow keys for nudge
      else if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (document.activeElement.tagName !== 'INPUT') {
          e.preventDefault()
          const updatedLayout = cloneLayout(layout)
          const element = updatedLayout.elements.find(el => el.id === selectedElement)
          if (element) {
            const nudgeAmount = e.shiftKey ? 10 : 1
            switch (e.key) {
              case 'ArrowUp':
                element.y -= nudgeAmount
                break
              case 'ArrowDown':
                element.y += nudgeAmount
                break
              case 'ArrowLeft':
                element.x -= nudgeAmount
                break
              case 'ArrowRight':
                element.x += nudgeAmount
                break
            }
            onLayoutChange(updatedLayout)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readOnly, selectedElement, clipboard, layout, history, historyIndex, handleDeleteElement, onLayoutChange])

  const selectedElementData = layout.elements.find(el => el.id === selectedElement)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-[#00f0ff]" />
          <h2 className="text-lg font-semibold text-white">Certificate Designer</h2>
          {unsavedChanges && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
              Unsaved changes
            </span>
          )}
          {selectedElements.length > 1 && (
            <span className="px-2 py-1 bg-[#00f0ff]/20 text-[#00f0ff] text-xs rounded">
              {selectedElements.length} selected
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0 || readOnly}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1 || readOnly}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={!selectedElement || readOnly}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-[#1f2229] text-[#b9cacb] text-sm rounded hover:bg-[#2a2e38] transition-colors"
          >
            Reset to Default
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 bg-[#00f0ff] text-[#00363a] text-sm rounded font-medium hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Layout
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div 
            ref={canvasRef}
            className="relative bg-[#0a0c10] border border-[#1f2229] rounded-lg overflow-auto"
            style={{ 
              aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
              cursor: isDragging ? 'grabbing' : 'default',
              minHeight: `${CANVAS_HEIGHT * SCALE}px`
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Scaled container for WYSIWYG preview */}
            <div style={{ 
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}>
              {/* Background */}
              {settings.backgroundUrl && (
                <img
                  src={settings.backgroundUrl}
                  alt="Certificate background"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ pointerEvents: 'none' }}
                />
              )}

              {/* Elements */}
              {layout.elements.map((element) => {
                const isSelected = selectedElement === element.id
                const displayText = getElementText(element, DEMO_CERTIFICATE_DATA, settings)
                const displaySrc = getElementSrc(element, settings)

                // Determine element type for rendering
                const isTextElement = ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type)
                const isImageElement = ['logo', 'signature', 'image'].includes(element.type)
                const isQrElement = element.type === 'qrCode'

                return (
                  <div
                    key={element.id}
                    className={`absolute ${isSelected || selectedElements.includes(element.id) ? 'ring-2 ring-[#00f0ff]' : ''} ${element.locked ? 'opacity-75' : ''}`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      opacity: element.visible !== false ? (element.style?.opacity || 1) : 0,
                      pointerEvents: element.locked ? 'none' : 'auto',
                      display: element.visible === false ? 'none' : 'block'
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                    onClick={() => handleSelectElement(element.id)}
                  >
                    {isTextElement && (
                      <div
                        style={{
                          fontFamily: element.style?.fontFamily || 'Roboto',
                          fontSize: element.style?.fontSize || 12,
                          fontWeight: element.style?.fontWeight || 400,
                          fontStyle: element.style?.fontStyle || 'normal',
                          color: element.style?.color || '#ffffff',
                          textAlign: element.style?.textAlign || 'left',
                          lineHeight: element.style?.lineHeight || 1,
                          letterSpacing: element.style?.letterSpacing || 0,
                          whiteSpace: 'normal',
                          overflow: 'visible',
                          ...(element.style?.outlineWidth && element.style.outlineWidth > 0 ? {
                            WebkitTextStroke: `${element.style.outlineWidth}px ${element.style.outlineColor || '#ffffff'}`,
                            paintOrder: 'stroke',
                          } : {}),
                        }}
                      >
                        {displayText}
                      </div>
                    )}
                    {isImageElement && displaySrc && (
                      <img
                        src={displaySrc}
                        alt={element.id}
                        className="w-full h-full object-contain"
                      />
                    )}
                    {isQrElement && (
                      <div className="w-full h-full bg-white flex items-center justify-center">
                        <div className="w-4/5 h-4/5 bg-gray-800 rounded" />
                      </div>
                    )}
                    {isSelected && !readOnly && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00f0ff] rounded-full" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="space-y-4">
          {selectedElementData ? (
            <>
              <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">{selectedElementData.id}</h3>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(selectedElementData.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedElementData.visible !== false 
                          ? 'bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/30' 
                          : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#2a2e38]'
                      }`}
                      title={selectedElementData.visible !== false ? 'Hide' : 'Show'}
                    >
                      {selectedElementData.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(selectedElementData.id)}
                      className={`p-1.5 rounded transition-colors ${
                        selectedElementData.locked 
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                          : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#2a2e38]'
                      }`}
                      title={selectedElementData.locked ? 'Unlock' : 'Lock'}
                    >
                      {selectedElementData.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElementData.id)}
                      className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#b9cacb] mb-1">Position X</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.x)}
                      onChange={(e) => {
                        const updatedLayout = cloneLayout(layout)
                        const element = updatedLayout.elements.find(el => el.id === selectedElement)
                        if (element) {
                          element.x = Number(e.target.value)
                          onLayoutChange(updatedLayout)
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#b9cacb] mb-1">Position Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedElementData.y)}
                      onChange={(e) => {
                        const updatedLayout = cloneLayout(layout)
                        const element = updatedLayout.elements.find(el => el.id === selectedElement)
                        if (element) {
                          element.y = Number(e.target.value)
                          onLayoutChange(updatedLayout)
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Width</label>
                      <input
                        type="number"
                        value={Math.round(selectedElementData.width)}
                        onChange={(e) => {
                          const updatedLayout = cloneLayout(layout)
                          const element = updatedLayout.elements.find(el => el.id === selectedElement)
                          if (element) {
                            element.width = Number(e.target.value)
                            onLayoutChange(updatedLayout)
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Height</label>
                      <input
                        type="number"
                        value={Math.round(selectedElementData.height)}
                        onChange={(e) => {
                          const updatedLayout = cloneLayout(layout)
                          const element = updatedLayout.elements.find(el => el.id === selectedElement)
                          if (element) {
                            element.height = Number(e.target.value)
                            onLayoutChange(updatedLayout)
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              {['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(selectedElementData.type) && (
                <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">Typography</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedElementData.style?.fontSize || 12}
                        onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedElementData.style?.color || '#ffffff'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="h-8 w-10 rounded border border-[#1f2229] cursor-pointer"
                          disabled={readOnly}
                        />
                        <input
                          type="text"
                          value={selectedElementData.style?.color || '#ffffff'}
                          onChange={(e) => handleStyleChange('color', e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Text Align</label>
                      <div className="flex gap-1">
                        {['left', 'center', 'right'].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() => handleStyleChange('textAlign', align)}
                            className={`flex-1 p-2 rounded border ${
                              selectedElementData.style?.textAlign === align
                                ? 'bg-[#00f0ff] border-[#00f0ff] text-[#00363a]'
                                : 'bg-[#070B12] border-[#1f2229] text-[#b9cacb] hover:border-[#00f0ff]'
                            }`}
                            disabled={readOnly}
                          >
                            {align === 'left' && <AlignLeft className="h-4 w-4 mx-auto" />}
                            {align === 'center' && <AlignCenter className="h-4 w-4 mx-auto" />}
                            {align === 'right' && <AlignRight className="h-4 w-4 mx-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Outline Width</label>
                      <input
                        type="number"
                        value={selectedElementData.style?.outlineWidth || 0}
                        onChange={(e) => handleStyleChange('outlineWidth', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                        disabled={readOnly}
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#b9cacb] mb-1">Outline Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedElementData.style?.outlineColor || '#ffffff'}
                          onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                          className="h-8 w-10 rounded border border-[#1f2229] cursor-pointer"
                          disabled={readOnly}
                        />
                        <input
                          type="text"
                          value={selectedElementData.style?.outlineColor || '#ffffff'}
                          onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-4">
              <p className="text-sm text-[#b9cacb]">Select an element to edit its properties</p>
            </div>
          )}

          {/* Layer Panel */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Layers</h3>
            <div className="space-y-1">
              {layout.elements.map((element) => (
                <div
                  key={element.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                    selectedElement === element.id ? 'bg-[#00f0ff]/20' : 'hover:bg-[#1f2229]'
                  } ${element.visible === false ? 'opacity-50' : ''}`}
                  onClick={() => handleSelectElement(element.id)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleVisible(element.id)
                    }}
                    className={`p-1 rounded transition-colors ${
                      element.visible !== false 
                        ? 'text-[#00f0ff] hover:bg-[#00f0ff]/20' 
                        : 'text-[#b9cacb] hover:bg-[#1f2229]'
                    }`}
                    title={element.visible !== false ? 'Hide' : 'Show'}
                  >
                    {element.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 text-xs text-[#b9cacb]">{element.id}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleLock(element.id)
                    }}
                    className={`p-1 rounded transition-colors ${
                      element.locked 
                        ? 'text-yellow-400 hover:bg-yellow-400/20' 
                        : 'text-[#b9cacb] hover:bg-[#1f2229]'
                    }`}
                    title={element.locked ? 'Unlock' : 'Lock'}
                  >
                    {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, Unlock, Eye, EyeOff, Layers, AlignLeft, AlignCenter, AlignRight, Move, RotateCw, Trash2, Save, Loader2 } from 'lucide-react'
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
const SCALE = 0.5 // Scale down for admin UI

export function CertificateDesigner({ layout, onLayoutChange, settings, readOnly = false, onSave, isSaving = false }: CertificateDesignerProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(true)
  }, [layout])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CertificateElement) => {
    if (readOnly || element.locked) return

    e.stopPropagation()
    setSelectedElement(element.id)
    setIsDragging(true)

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    setDragOffset({
      x: (e.clientX - rect.left) * scaleX - element.x,
      y: (e.clientY - rect.top) * scaleY - element.y
    })
  }, [readOnly])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || readOnly) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    const newX = (e.clientX - rect.left) * scaleX - dragOffset.x
    const newY = (e.clientY - rect.top) * scaleY - dragOffset.y

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
    }
  }, [layout, onLayoutChange, selectedElement, onLayoutChange])

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
        </div>
        <div className="flex gap-2">
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
            className="relative bg-[#0a0c10] border border-[#1f2229] rounded-lg overflow-hidden"
            style={{ 
              aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
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
                  className={`absolute ${isSelected ? 'ring-2 ring-[#00f0ff]' : ''} ${element.locked ? 'opacity-75' : ''}`}
                  style={{
                    left: `${(element.x / CANVAS_WIDTH) * 100}%`,
                    top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
                    width: `${(element.width / CANVAS_WIDTH) * 100}%`,
                    height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
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
                        fontSize: `${(element.style?.fontSize || 12) / SCALE}px`,
                        fontWeight: element.style?.fontWeight || 400,
                        fontStyle: element.style?.fontStyle || 'normal',
                        color: element.style?.color || '#ffffff',
                        textAlign: element.style?.textAlign || 'left',
                        lineHeight: element.style?.lineHeight || 1,
                        letterSpacing: `${(element.style?.letterSpacing || 0) / SCALE}px`,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
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
                      className="p-1.5 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38]"
                    >
                      {selectedElementData.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(selectedElementData.id)}
                      className="p-1.5 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38]"
                    >
                      {selectedElementData.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(selectedElementData.id)}
                      className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
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
                      <label className="block text-xs text-[#b9cacb] mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElementData.style?.opacity || 1}
                        onChange={(e) => handleStyleChange('opacity', Number(e.target.value))}
                        className="w-full"
                        disabled={readOnly}
                      />
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
                  }`}
                  onClick={() => handleSelectElement(element.id)}
                >
                  <div className="flex-1 text-xs text-[#b9cacb]">{element.id}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleVisible(element.id)
                    }}
                    className="p-1 text-[#b9cacb] hover:text-white"
                  >
                    {element.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleLock(element.id)
                    }}
                    className="p-1 text-[#b9cacb] hover:text-white"
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
"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, Unlock, Eye, EyeOff, Layers, AlignLeft, AlignCenter, AlignRight, Move, RotateCw, Trash2, Save, Loader2, Undo, Redo, Copy, Clipboard, ZoomIn, ZoomOut, Maximize2, Type, Image, Square, QrCode, Award, PenTool, Settings, LayoutGrid, ChevronDown, MousePointer2 } from 'lucide-react'
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
const GRID_SIZE = 20 // Grid size for snap-to-grid
const SNAP_THRESHOLD = 10 // Pixels threshold for snapping

export function CertificateDesigner({ layout, onLayoutChange, settings, readOnly = false, onSave, isSaving = false }: CertificateDesignerProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [history, setHistory] = useState<CertificateLayout[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [clipboard, setClipboard] = useState<CertificateElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'position' | 'style' | 'text' | 'layers'>('position')
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [alignmentGuides, setAlignmentGuides] = useState<{ horizontal: number[]; vertical: number[] }>({ horizontal: [], vertical: [] })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

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

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CertificateElement, handle?: string) => {
    if (readOnly || element.locked) return

    e.stopPropagation()
    
    // Handle resize handles
    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
      setSelectedElement(element.id)
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scale = SCALE
      setDragOffset({
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      })
      return
    }
    
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

  const handleElementDoubleClick = useCallback((element: CertificateElement) => {
    if (readOnly || element.locked || element.binding) return
    
    const isTextElement = ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type)
    if (isTextElement && !element.binding) {
      setEditingText(element.id)
      setSelectedElement(element.id)
    }
  }, [readOnly])

  const handlePanelResizeStart = useCallback((panel: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const startX = e.clientX
    const startLeftWidth = leftSidebarWidth
    const startRightWidth = rightSidebarWidth

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (panel === 'left') {
        const deltaX = moveEvent.clientX - startX
        setLeftSidebarWidth(Math.max(200, Math.min(400, startLeftWidth + deltaX)))
      } else {
        const deltaX = startX - moveEvent.clientX
        setRightSidebarWidth(Math.max(250, Math.min(500, startRightWidth + deltaX)))
      }
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [leftSidebarWidth, rightSidebarWidth])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle resizing
    if (isResizing && selectedElement && resizeHandle && !readOnly) {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scale = SCALE
      const mouseX = (e.clientX - rect.left) / scale
      const mouseY = (e.clientY - rect.top) / scale

      const element = layout.elements.find(el => el.id === selectedElement)
      if (!element) return

      const updatedLayout = cloneLayout(layout)
      const updatedElement = updatedLayout.elements.find(el => el.id === selectedElement)
      if (!updatedElement) return

      let newWidth = element.width
      let newHeight = element.height
      let newX = element.x
      let newY = element.y

      // Handle different resize handles
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(20, mouseX - element.x)
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(20, element.width + element.x - mouseX)
        newX = mouseX
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(20, mouseY - element.y)
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(20, element.height + element.y - mouseY)
        newY = mouseY
      }

      // Snap to grid
      if (snapToGrid) {
        newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE
        newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
      }

      updatedElement.width = newWidth
      updatedElement.height = newHeight
      updatedElement.x = newX
      updatedElement.y = newY

      onLayoutChange(updatedLayout)
      return
    }

    // Handle dragging
    if (!isDragging || !selectedElement || readOnly) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scale = SCALE

    let newX = (e.clientX - rect.left) / scale - dragOffset.x
    let newY = (e.clientY - rect.top) / scale - dragOffset.y

    const element = layout.elements.find(el => el.id === selectedElement)
    if (!element) return

    // Snap to grid
    if (snapToGrid) {
      newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
      newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
    }

    // Calculate alignment guides
    const horizontalGuides: number[] = []
    const verticalGuides: number[] = []

    layout.elements.forEach(otherElement => {
      if (otherElement.id === selectedElement) return

      // Check for horizontal alignment (center)
      if (Math.abs((otherElement.x + otherElement.width / 2) - (newX + element.width / 2)) < SNAP_THRESHOLD) {
        newX = otherElement.x + otherElement.width / 2 - element.width / 2
        horizontalGuides.push(otherElement.y + otherElement.height / 2)
      }

      // Check for vertical alignment (center)
      if (Math.abs((otherElement.y + otherElement.height / 2) - (newY + element.height / 2)) < SNAP_THRESHOLD) {
        newY = otherElement.y + otherElement.height / 2 - element.height / 2
        verticalGuides.push(otherElement.x + otherElement.width / 2)
      }

      // Check for left edge alignment
      if (Math.abs(otherElement.x - newX) < SNAP_THRESHOLD) {
        newX = otherElement.x
        verticalGuides.push(otherElement.x)
      }

      // Check for right edge alignment
      if (Math.abs((otherElement.x + otherElement.width) - (newX + element.width)) < SNAP_THRESHOLD) {
        newX = otherElement.x + otherElement.width - element.width
        verticalGuides.push(otherElement.x + otherElement.width)
      }

      // Check for top edge alignment
      if (Math.abs(otherElement.y - newY) < SNAP_THRESHOLD) {
        newY = otherElement.y
        horizontalGuides.push(otherElement.y)
      }

      // Check for bottom edge alignment
      if (Math.abs((otherElement.y + otherElement.height) - (newY + element.height)) < SNAP_THRESHOLD) {
        newY = otherElement.y + otherElement.height - element.height
        horizontalGuides.push(otherElement.y + otherElement.height)
      }
    })

    setAlignmentGuides({ horizontal: horizontalGuides, vertical: verticalGuides })

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
  }, [isDragging, isResizing, selectedElement, resizeHandle, dragOffset, layout, onLayoutChange, readOnly, snapToGrid])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setAlignmentGuides({ horizontal: [], vertical: [] })
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

  const handleTextChange = useCallback((text: string) => {
    if (!selectedElement) return

    const updatedLayout = cloneLayout(layout)
    const element = updatedLayout.elements.find(el => el.id === selectedElement)
    if (element && !element.binding) {
      element.text = text
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
      if (editingText) return // Don't handle shortcuts when editing text

      const activeElement = document.activeElement
      const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'

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
        if (selectedElement && !isInput) {
          e.preventDefault()
          handleDeleteElement(selectedElement)
        }
      }
      // Ctrl+C for copy
      else if (e.ctrlKey && e.key === 'c') {
        if (selectedElement && !isInput) {
          e.preventDefault()
          const element = layout.elements.find(el => el.id === selectedElement)
          if (element) {
            setClipboard(JSON.parse(JSON.stringify(element)))
          }
        }
      }
      // Ctrl+V for paste
      else if (e.ctrlKey && e.key === 'v') {
        if (clipboard && !isInput) {
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
        if (selectedElement && !isInput) {
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
        if (!isInput) {
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
  }, [readOnly, selectedElement, clipboard, layout, history, historyIndex, handleDeleteElement, onLayoutChange, editingText])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.1))
  }, [])

  const handleZoomReset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleFitToScreen = useCallback(() => {
    const container = canvasContainerRef.current
    if (container) {
      const containerWidth = container.clientWidth - 40 // padding
      const containerHeight = container.clientHeight - 40
      const scaleX = containerWidth / CANVAS_WIDTH
      const scaleY = containerHeight / CANVAS_HEIGHT
      const fitZoom = Math.min(scaleX, scaleY, 1)
      setZoom(fitZoom)
      setPan({ x: 0, y: 0 })
    }
  }, [])

  // Handle pan
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+left click
      setIsPanning(true)
      setDragOffset({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
  }, [isPanning, dragOffset])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Add new element
  const handleAddElement = useCallback((type: string) => {
    const updatedLayout = cloneLayout(layout)
    const newId = `${type}_${Date.now()}`
    
    let newElement: CertificateElement
    
    switch (type) {
      case 'text':
        newElement = {
          id: newId,
          type: 'text',
          x: CANVAS_WIDTH / 2 - 100,
          y: CANVAS_HEIGHT / 2,
          width: 200,
          height: 30,
          rotation: 0,
          visible: true,
          locked: false,
          text: 'New Text',
          style: {
            fontSize: 16,
            color: '#ffffff',
            textAlign: 'center',
          },
        }
        break
      case 'image':
        newElement = {
          id: newId,
          type: 'image',
          x: CANVAS_WIDTH / 2 - 50,
          y: CANVAS_HEIGHT / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
          style: {
            objectFit: 'contain',
          },
        }
        break
      case 'shape':
        newElement = {
          id: newId,
          type: 'text',
          x: CANVAS_WIDTH / 2 - 50,
          y: CANVAS_HEIGHT / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
          text: '■',
          style: {
            fontSize: 80,
            color: '#00f0ff',
            textAlign: 'center',
          },
        }
        break
      case 'qrCode':
        newElement = {
          id: newId,
          type: 'qrCode',
          x: CANVAS_WIDTH / 2 - 50,
          y: CANVAS_HEIGHT / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'qr',
        }
        break
      case 'logo':
        newElement = {
          id: newId,
          type: 'logo',
          x: CANVAS_WIDTH / 2 - 50,
          y: CANVAS_HEIGHT / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'logo',
          style: {
            objectFit: 'contain',
          },
        }
        break
      case 'signature':
        newElement = {
          id: newId,
          type: 'signature',
          x: CANVAS_WIDTH / 2 - 50,
          y: CANVAS_HEIGHT / 2 - 50,
          width: 100,
          height: 100,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'signature',
          style: {
            objectFit: 'contain',
          },
        }
        break
      default:
        return
    }
    
    updatedLayout.elements.push(newElement)
    onLayoutChange(updatedLayout)
    setSelectedElement(newId)
  }, [layout, onLayoutChange])

  const selectedElementData = layout.elements.find(el => el.id === selectedElement)

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10]">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0c0e12] border-b border-[#1f2229]">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-[#00f0ff]" />
          <h2 className="text-lg font-semibold text-white">Certificate Designer v2.0</h2>
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
        
        <div className="flex items-center gap-2">
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
          <div className="w-px h-6 bg-[#1f2229]" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm text-[#b9cacb] min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-2 bg-[#1f2229] text-[#b9cacb] rounded hover:bg-[#2a2e38] transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-[#1f2229]" />
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded transition-colors ${showGrid ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#2a2e38]'}`}
            title="Toggle Grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded transition-colors ${snapToGrid ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#2a2e38]'}`}
            title="Toggle Snap to Grid"
          >
            <Layers className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-[#1f2229]" />
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-[#1f2229] text-[#b9cacb] text-sm rounded hover:bg-[#2a2e38] transition-colors"
          >
            Reset
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Elements */}
        <div 
          className={`bg-[#0c0e12] border-r border-[#1f2229] flex flex-col ${leftSidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: leftSidebarCollapsed ? 48 : leftSidebarWidth }}
        >
          <div className="flex items-center justify-between p-2 border-b border-[#1f2229]">
            <button
              type="button"
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="text-[#b9cacb] hover:bg-[#1f2229] p-1 rounded"
            >
              {leftSidebarCollapsed ? <ChevronDown className="h-4 w-4 rotate-90" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {!leftSidebarCollapsed && (
              <div 
                className="w-2 h-8 bg-[#1f2229] cursor-col-resize hover:bg-[#00f0ff] rounded"
                onMouseDown={(e) => handlePanelResizeStart('left', e)}
              />
            )}
          </div>
          
          {!leftSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-[#b9cacb] mb-3 uppercase tracking-wider">Elements</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleAddElement('text')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <Type className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('image')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <Image className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('shape')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <Square className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">Shape</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('qrCode')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <QrCode className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('logo')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <Award className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">Logo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddElement('signature')}
                    className="w-full flex items-center gap-3 p-3 bg-[#1f2229] rounded-lg hover:bg-[#2a2e38] transition-colors text-left"
                  >
                    <PenTool className="h-4 w-4 text-[#00f0ff]" />
                    <span className="text-sm text-white">Signature</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-[#b9cacb] mb-3 uppercase tracking-wider">Templates</h3>
                <div className="p-3 bg-[#1f2229] rounded-lg text-center">
                  <p className="text-xs text-[#b9cacb]">Coming soon</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 bg-[#0a0c10] overflow-hidden relative"
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <div 
            ref={canvasRef}
            className="absolute transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <div 
              className="relative bg-[#0a0c10] border border-[#1f2229]"
              style={{ 
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                cursor: isDragging ? 'grabbing' : 'default',
                backgroundImage: showGrid ? `
                  linear-gradient(to right, #1f2229 1px, transparent 1px),
                  linear-gradient(to bottom, #1f2229 1px, transparent 1px)
                ` : 'none',
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
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

              {/* Alignment Guides */}
              {alignmentGuides.horizontal.map((y, index) => (
                <div
                  key={`h-${index}`}
                  className="absolute left-0 right-0 bg-[#00f0ff] pointer-events-none"
                  style={{ top: y, height: '1px', opacity: 0.5 }}
                />
              ))}
              {alignmentGuides.vertical.map((x, index) => (
                <div
                  key={`v-${index}`}
                  className="absolute top-0 bottom-0 bg-[#00f0ff] pointer-events-none"
                  style={{ left: x, width: '1px', opacity: 0.5 }}
                />
              ))}

              {/* Elements */}
              {layout.elements.map((element) => {
                const isSelected = selectedElement === element.id
                const displayText = getElementText(element, DEMO_CERTIFICATE_DATA, settings)
                const displaySrc = getElementSrc(element, settings)

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
                      display: element.visible === false ? 'none' : 'block',
                      ...(element.style?.background && { background: element.style.background }),
                      ...(element.style?.border && { border: element.style.border }),
                      ...(element.style?.borderRadius && { borderRadius: element.style.borderRadius }),
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, element)}
                    onClick={() => handleSelectElement(element.id)}
                    onDoubleClick={() => handleElementDoubleClick(element)}
                  >
                    {isTextElement && (
                      editingText === element.id ? (
                        <textarea
                          autoFocus
                          value={element.text || ''}
                          onChange={(e) => handleTextChange(e.target.value)}
                          onBlur={() => setEditingText(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingText(null)
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-full h-full bg-transparent text-white resize-none outline-none"
                          style={{
                            fontFamily: element.style?.fontFamily || 'Roboto',
                            fontSize: element.style?.fontSize || 12,
                            fontWeight: element.style?.fontWeight || 400,
                            fontStyle: element.style?.fontStyle || 'normal',
                            color: element.style?.color || '#ffffff',
                            textAlign: element.style?.textAlign || 'left',
                            lineHeight: element.style?.lineHeight || 1,
                            letterSpacing: element.style?.letterSpacing || 0,
                            whiteSpace: 'pre-wrap',
                            overflow: 'visible',
                            textShadow: element.style?.textShadow || '0 2px 8px rgba(0,0,0,0.78)',
                            ...(element.style?.outlineWidth && element.style.outlineWidth > 0 ? {
                              WebkitTextStroke: `${element.style.outlineWidth}px ${element.style.outlineColor || '#ffffff'}`,
                              paintOrder: 'stroke',
                            } : {}),
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => handleElementDoubleClick(element)}
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
                            cursor: element.binding ? 'default' : 'text',
                            textShadow: element.style?.textShadow || '0 2px 8px rgba(0,0,0,0.78)',
                            ...(element.style?.outlineWidth && element.style.outlineWidth > 0 ? {
                              WebkitTextStroke: `${element.style.outlineWidth}px ${element.style.outlineColor || '#ffffff'}`,
                              paintOrder: 'stroke',
                            } : {}),
                          }}
                        >
                          {displayText}
                        </div>
                      )
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
                      <>
                        {/* Resize handles */}
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-nwse-resize"
                          style={{ top: -4, left: -4 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'nw')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-ns-resize"
                          style={{ top: -4, left: '50%', transform: 'translateX(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'n')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-nesw-resize"
                          style={{ top: -4, right: -4 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'ne')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-ew-resize"
                          style={{ top: '50%', right: -4, transform: 'translateY(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'e')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-nwse-resize"
                          style={{ bottom: -4, right: -4 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'se')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-ns-resize"
                          style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 's')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-nesw-resize"
                          style={{ bottom: -4, left: -4 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'sw')}
                        />
                        <div
                          className="absolute w-2 h-2 bg-[#00f0ff] cursor-ew-resize"
                          style={{ top: '50%', left: -4, transform: 'translateY(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'w')}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-[#b9cacb] hover:text-white"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32"
            />
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-[#b9cacb] hover:text-white"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1 text-[#b9cacb] hover:text-white"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div 
          className={`bg-[#0c0e12] border-l border-[#1f2229] flex flex-col ${rightSidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: rightSidebarCollapsed ? 48 : rightSidebarWidth }}
        >
          <div className="flex items-center justify-between p-2 border-b border-[#1f2229]">
            <button
              type="button"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="text-[#b9cacb] hover:bg-[#1f2229] p-1 rounded"
            >
              {rightSidebarCollapsed ? <ChevronDown className="h-4 w-4 -rotate-90" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
            </button>
            {!rightSidebarCollapsed && (
              <div 
                className="w-2 h-8 bg-[#1f2229] cursor-col-resize hover:bg-[#00f0ff] rounded"
                onMouseDown={(e) => handlePanelResizeStart('right', e)}
              />
            )}
          </div>
          
          {!rightSidebarCollapsed && (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-[#1f2229] shrink-0">
                {[
                  { id: 'position', label: 'Position', icon: <Move className="h-4 w-4" /> },
                  { id: 'style', label: 'Style', icon: <Settings className="h-4 w-4" /> },
                  { id: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
                  { id: 'layers', label: 'Layers', icon: <LayoutGrid className="h-4 w-4" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1 p-2 text-sm transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-b-2 border-[#00f0ff]' 
                        : 'text-[#b9cacb] hover:bg-[#1f2229]'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-20">
                {selectedElementData ? (
                  <>
                    {/* Element Header */}
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

                    {/* Position Tab */}
                    {activeTab === 'position' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-[#b9cacb] mb-1">X</label>
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
                            <label className="block text-xs text-[#b9cacb] mb-1">Y</label>
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
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Rotation</label>
                          <input
                            type="number"
                            value={selectedElementData.rotation || 0}
                            onChange={(e) => {
                              const updatedLayout = cloneLayout(layout)
                              const element = updatedLayout.elements.find(el => el.id === selectedElement)
                              if (element) {
                                element.rotation = Number(e.target.value)
                                onLayoutChange(updatedLayout)
                              }
                            }}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    )}

                    {/* Style Tab */}
                    {activeTab === 'style' && (
                      <div className="space-y-3">
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
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Background Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.background || '#000000'}
                              onChange={(e) => handleStyleChange('background', e.target.value)}
                              className="h-8 w-10 rounded border border-[#1f2229] cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.background || '#000000'}
                              onChange={(e) => handleStyleChange('background', e.target.value)}
                              className="flex-1 px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Border Width</label>
                          <input
                            type="number"
                            value={selectedElementData.style?.borderWidth ?? 0}
                            onChange={(e) => {
                              const width = Number(e.target.value)
                              const color = selectedElementData.style?.borderColor || '#ffffff'
                              handleStyleChange('borderWidth', width)
                              handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                            }}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                            min="0"
                            step="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Border Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.borderColor || '#ffffff'}
                              onChange={(e) => {
                                const color = e.target.value
                                const width = selectedElementData.style?.borderWidth || 0
                                handleStyleChange('borderColor', color)
                                handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                              }}
                              className="h-8 w-10 rounded border border-[#1f2229] cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.borderColor || '#ffffff'}
                              onChange={(e) => {
                                const color = e.target.value
                                const width = selectedElementData.style?.borderWidth || 0
                                handleStyleChange('borderColor', color)
                                handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                              }}
                              className="flex-1 px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Tab */}
                    {activeTab === 'text' && ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(selectedElementData.type) && (
                      <div className="space-y-3">
                        {/* Text Content */}
                        {!selectedElementData.binding && (
                          <div>
                            <label className="block text-xs text-[#b9cacb] mb-1">Text Content</label>
                            <textarea
                              value={selectedElementData.text || ''}
                              onChange={(e) => {
                                const updatedLayout = cloneLayout(layout)
                                const element = updatedLayout.elements.find(el => el.id === selectedElement)
                                if (element) {
                                  element.text = e.target.value
                                  onLayoutChange(updatedLayout)
                                }
                              }}
                              className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white resize-none"
                              disabled={readOnly}
                              rows={2}
                            />
                          </div>
                        )}
                        {selectedElementData.binding && (
                          <div>
                            <label className="block text-xs text-[#b9cacb] mb-1">Dynamic Binding</label>
                            <div className="px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-[#b9cacb]">
                              {selectedElementData.binding}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Font Family</label>
                          <select
                            value={selectedElementData.style?.fontFamily || 'Roboto'}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          >
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Lato">Lato</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Playfair Display">Playfair Display</option>
                            <option value="Oswald">Oswald</option>
                            <option value="Raleway">Raleway</option>
                            <option value="Poppins">Poppins</option>
                          </select>
                        </div>
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
                          <label className="block text-xs text-[#b9cacb] mb-1">Font Weight</label>
                          <select
                            value={selectedElementData.style?.fontWeight || 400}
                            onChange={(e) => handleStyleChange('fontWeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          >
                            <option value={300}>Light</option>
                            <option value={400}>Regular</option>
                            <option value={500}>Medium</option>
                            <option value={600}>Semibold</option>
                            <option value={700}>Bold</option>
                            <option value={800}>Extra Bold</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Font Style</label>
                          <select
                            value={selectedElementData.style?.fontStyle || 'normal'}
                            onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Text Transform</label>
                          <select
                            value={selectedElementData.style?.textTransform || 'none'}
                            onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          >
                            <option value="none">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
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
                          <label className="block text-xs text-[#b9cacb] mb-1">Text Shadow</label>
                          <input
                            type="text"
                            value={selectedElementData.style?.textShadow ?? '0 2px 8px rgba(0,0,0,0.78)'}
                            onChange={(e) => handleStyleChange('textShadow', e.target.value)}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                            placeholder="0 2px 8px rgba(0,0,0,0.78)"
                          />
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
                          <label className="block text-xs text-[#b9cacb] mb-1">Line Height</label>
                          <input
                            type="number"
                            step="0.1"
                            value={selectedElementData.style?.lineHeight || 1}
                            onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Letter Spacing</label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElementData.style?.letterSpacing || 0}
                            onChange={(e) => handleStyleChange('letterSpacing', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#b9cacb] mb-1">Line Height</label>
                          <input
                            type="number"
                            step="0.1"
                            value={selectedElementData.style?.lineHeight || 1}
                            onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded text-sm text-white"
                            disabled={readOnly}
                          />
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
                    )}

                    {/* Layers Tab */}
                    {activeTab === 'layers' && (
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
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MousePointer2 className="h-8 w-8 text-[#b9cacb] mx-auto mb-2" />
                    <p className="text-sm text-[#b9cacb]">Select an element to edit its properties</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

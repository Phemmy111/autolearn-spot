"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, Unlock, Eye, EyeOff, Layers, AlignLeft, AlignCenter, AlignRight, Move, RotateCw, Trash2, Save, Loader2, Undo, Redo, Copy, Clipboard, ZoomIn, ZoomOut, Maximize2, Type, Image, Square, QrCode, Award, PenTool, Settings, LayoutGrid, ChevronDown, ChevronUp, MousePointer2, Upload, RotateCcw, Sparkles, User, GraduationCap, Calendar, FileText, Check, ShieldCheck, Minus } from 'lucide-react'
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
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [clipboard, setClipboard] = useState<CertificateElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'position' | 'style' | 'text' | 'layers'>('position')
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<{ horizontal: number[]; vertical: number[] }>({ horizontal: [], vertical: [] })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string | null>(null)
  const [lastAutoSave, setLastAutoSave] = useState<number>(Date.now())
  const [validationMode, setValidationMode] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Keep latest layout in a ref to avoid stale closures during high-frequency events
  const latestLayoutRef = useRef<CertificateLayout>(layout)
  useEffect(() => {
    latestLayoutRef.current = layout
  }, [layout])

  // Dedicated history management for rock-solid Undo / Redo
  const historyRef = useRef<CertificateLayout[]>([])
  const historyIndexRef = useRef<number>(-1)

  // Initialize history on mount
  useEffect(() => {
    if (historyRef.current.length === 0 && layout) {
      historyRef.current = [cloneLayout(layout)]
      historyIndexRef.current = 0
      setCanUndo(false)
      setCanRedo(false)
    }
  }, [])

  const recordHistory = useCallback((newLayout: CertificateLayout) => {
    const cloned = cloneLayout(newLayout)
    const curIdx = historyIndexRef.current
    const newHist = historyRef.current.slice(0, curIdx + 1)
    newHist.push(cloned)
    if (newHist.length > 50) {
      newHist.shift()
    }
    historyRef.current = newHist
    historyIndexRef.current = newHist.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
    setUnsavedChanges(true)
  }, [])

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1
      const target = cloneLayout(historyRef.current[historyIndexRef.current])
      latestLayoutRef.current = target
      onLayoutChange(target)
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
      setUnsavedChanges(true)
    }
  }, [onLayoutChange])

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1
      const target = cloneLayout(historyRef.current[historyIndexRef.current])
      latestLayoutRef.current = target
      onLayoutChange(target)
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
      setUnsavedChanges(true)
    }
  }, [onLayoutChange])

  // Drag & Resize interaction tracking in screen-to-canvas coordinates
  const interactionRef = useRef<{
    active: boolean
    mode: 'drag' | 'resize'
    elementId: string
    handle?: string
    startClientX: number
    startClientY: number
    initialX: number
    initialY: number
    initialWidth: number
    initialHeight: number
    hasMoved: boolean
  }>({
    active: false,
    mode: 'drag',
    elementId: '',
    startClientX: 0,
    startClientY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
    hasMoved: false,
  })

  // Global window listeners for 100% fluid, continuous drag & resize tracking
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const interaction = interactionRef.current
      if (!interaction.active) return

      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = rect.width / CANVAS_WIDTH
      const scaleY = rect.height / CANVAS_HEIGHT
      if (scaleX <= 0 || scaleY <= 0) return

      const deltaX = (e.clientX - interaction.startClientX) / scaleX
      const deltaY = (e.clientY - interaction.startClientY) / scaleY

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        interaction.hasMoved = true
      }

      if (interaction.mode === 'drag') {
        let newX = Math.round(interaction.initialX + deltaX)
        let newY = Math.round(interaction.initialY + deltaY)

        if (snapToGrid) {
          newX = Math.round(newX / 10) * 10
          newY = Math.round(newY / 10) * 10
        }

        // Keep inside canvas bounds
        newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - interaction.initialWidth))
        newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - interaction.initialHeight))

        const updated = cloneLayout(latestLayoutRef.current)
        const target = updated.elements.find(el => el.id === interaction.elementId)
        if (target) {
          target.x = newX
          target.y = newY
          latestLayoutRef.current = updated
          onLayoutChange(updated)
        }
      } else if (interaction.mode === 'resize' && interaction.handle) {
        const handle = interaction.handle
        let newX = interaction.initialX
        let newY = interaction.initialY
        let newWidth = interaction.initialWidth
        let newHeight = interaction.initialHeight

        const minW = 20
        const minH = 15

        // East (Right)
        if (handle.includes('e')) {
          newWidth = Math.max(minW, Math.round(interaction.initialWidth + deltaX))
        }
        // South (Bottom)
        if (handle.includes('s')) {
          newHeight = Math.max(minH, Math.round(interaction.initialHeight + deltaY))
        }
        // West (Left)
        if (handle.includes('w')) {
          const clampedW = Math.max(minW, Math.round(interaction.initialWidth - deltaX))
          newX = Math.round(interaction.initialX + (interaction.initialWidth - clampedW))
          newWidth = clampedW
        }
        // North (Top)
        if (handle.includes('n')) {
          const clampedH = Math.max(minH, Math.round(interaction.initialHeight - deltaY))
          newY = Math.round(interaction.initialY + (interaction.initialHeight - clampedH))
          newHeight = clampedH
        }

        if (snapToGrid) {
          newWidth = Math.round(newWidth / 10) * 10
          newHeight = Math.round(newHeight / 10) * 10
          newX = Math.round(newX / 10) * 10
          newY = Math.round(newY / 10) * 10
        }

        // Boundary constraints
        newX = Math.max(0, newX)
        newY = Math.max(0, newY)
        newWidth = Math.min(newWidth, CANVAS_WIDTH - newX)
        newHeight = Math.min(newHeight, CANVAS_HEIGHT - newY)

        const updated = cloneLayout(latestLayoutRef.current)
        const target = updated.elements.find(el => el.id === interaction.elementId)
        if (target) {
          target.x = newX
          target.y = newY
          target.width = newWidth
          target.height = newHeight
          latestLayoutRef.current = updated
          onLayoutChange(updated)
        }
      }
    }

    const handleGlobalMouseUp = () => {
      const interaction = interactionRef.current
      if (interaction.active) {
        if (interaction.hasMoved) {
          // Record single clean history snapshot on drag/resize release!
          recordHistory(latestLayoutRef.current)
        }
        interactionRef.current = {
          active: false,
          mode: 'drag',
          elementId: '',
          startClientX: 0,
          startClientY: 0,
          initialX: 0,
          initialY: 0,
          initialWidth: 0,
          initialHeight: 0,
          hasMoved: false,
        }
        setIsDragging(false)
        setIsResizing(false)
        setResizeHandle(null)
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [snapToGrid, recordHistory, onLayoutChange])

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: CertificateElement, handle?: string) => {
    if (readOnly || element.locked) return

    e.stopPropagation()
    e.preventDefault()

    setSelectedElement(element.id)
    setSelectedElements([element.id])

    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
      interactionRef.current = {
        active: true,
        mode: 'resize',
        elementId: element.id,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialX: element.x,
        initialY: element.y,
        initialWidth: element.width,
        initialHeight: element.height,
        hasMoved: false,
      }
    } else {
      setIsDragging(true)
      interactionRef.current = {
        active: true,
        mode: 'drag',
        elementId: element.id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialX: element.x,
        initialY: element.y,
        initialWidth: element.width,
        initialHeight: element.height,
        hasMoved: false,
      }
    }
  }, [readOnly])

  const handleElementDoubleClick = useCallback((element: CertificateElement) => {
    if (readOnly || element.locked) return
    
    const isDynamic = ['studentName', 'course', 'date', 'certificateId'].includes(element.id) || ['studentName', 'course', 'date', 'certificateId'].includes(element.type)
    const isTextElement = ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type) || element.id === 'brandTitle'
    
    if (isTextElement && !isDynamic) {
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

  const handleValidateLayout = useCallback(() => {
    const errors: string[] = []
    
    // Check for text overflow
    layout.elements.forEach(element => {
      if (['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type)) {
        const displayText = getElementText(element, DEMO_CERTIFICATE_DATA, settings)
        if (displayText && displayText.length > 100) {
          errors.push(`${element.id}: Text may be too long (${displayText.length} characters)`)
        }
      }
      
      // Check if element is outside canvas bounds
      if (element.x < 0 || element.y < 0 || element.x + element.width > CANVAS_WIDTH || element.y + element.height > CANVAS_HEIGHT) {
        errors.push(`${element.id}: Element is outside canvas bounds`)
      }
      
      // Check if element is too small
      if (element.width < 20 || element.height < 20) {
        errors.push(`${element.id}: Element is too small (${element.width}x${element.height})`)
      }
    })
    
    // Check for required fields
    const hasTitle = layout.elements.some(e => e.type === 'title' && e.visible !== false)
    const hasStudentName = layout.elements.some(e => e.type === 'studentName' && e.visible !== false)
    
    if (!hasTitle) errors.push('Missing required element: Title')
    if (!hasStudentName) errors.push('Missing required element: Student Name')
    
    setValidationErrors(errors)
    setValidationMode(true)
    
    if (errors.length === 0) {
      alert('No validation errors found! The layout looks good.')
    }
  }, [layout, settings])

  // Predefined templates
  const templates = [
    {
      name: 'Classic',
      description: 'Traditional certificate layout',
      layout: resetToDefault()
    },
    {
      name: 'Minimal',
      description: 'Clean and simple design',
      layout: {
        ...resetToDefault(),
        name: 'Minimal Certificate',
        elements: resetToDefault().elements.map(el => ({
          ...el,
          style: {
            ...el.style,
            fontSize: el.style?.fontSize ? el.style.fontSize * 0.8 : undefined
          }
        }))
      }
    },
    {
      name: 'Bold',
      description: 'Large typography focus',
      layout: {
        ...resetToDefault(),
        name: 'Bold Certificate',
        elements: resetToDefault().elements.map(el => ({
          ...el,
          style: {
            ...el.style,
            fontSize: el.style?.fontSize ? el.style.fontSize * 1.2 : undefined,
            fontWeight: 700
          }
        }))
      }
    }
  ]

  const handleLoadTemplate = useCallback((templateLayout: CertificateLayout) => {
    if (confirm('Load template? This will replace your current layout.')) {
      latestLayoutRef.current = templateLayout
      onLayoutChange(templateLayout)
      recordHistory(templateLayout)
      setSelectedElement(null)
      setUnsavedChanges(true)
    }
  }, [onLayoutChange, recordHistory])

  const handleSaveAsTemplate = useCallback(() => {
    const templateName = prompt('Enter template name:')
    if (!templateName) return
    
    const templateDescription = prompt('Enter template description:') || 'Custom template'
    
    // For now, we'll just save it to localStorage
    const savedTemplates = JSON.parse(localStorage.getItem('certificateTemplates') || '[]')
    savedTemplates.push({
      name: templateName,
      description: templateDescription,
      layout: layout,
      createdAt: new Date().toISOString()
    })
    localStorage.setItem('certificateTemplates', JSON.stringify(savedTemplates))
    
    alert('Template saved successfully!')
  }, [layout])

  const handleExportPreview = useCallback(() => {
    // Trigger a download of the current certificate
    const element = document.querySelector('a[href="/api/certificate/download"]')
    if (element && element instanceof HTMLElement) {
      element.click()
    } else {
      // Fallback: navigate to download page
      window.open('/api/certificate/download', '_blank')
    }
  }, [])

  const handleMoveLayerUp = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const elements = [...updatedLayout.elements]
    const currentIndex = elements.findIndex(el => el.id === elementId)
    
    if (currentIndex > 0) {
      const [element] = elements.splice(currentIndex, 1)
      elements.splice(currentIndex - 1, 0, element)
      updatedLayout.elements = elements
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [onLayoutChange, recordHistory])

  const handleMoveLayerDown = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const elements = [...updatedLayout.elements]
    const currentIndex = elements.findIndex(el => el.id === elementId)
    
    if (currentIndex < elements.length - 1) {
      const [element] = elements.splice(currentIndex, 1)
      elements.splice(currentIndex + 1, 0, element)
      updatedLayout.elements = elements
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [onLayoutChange, recordHistory])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('imageFile', file)

      const response = await fetch('/api/admin/certificate-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Create a new image element with the uploaded URL
      const updatedLayout = cloneLayout(layout)
      const newImageElement: CertificateElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
        style: {
          objectFit: 'contain'
        },
        src: data.url,
        visible: true,
        locked: false
      }
      
      updatedLayout.elements.push(newImageElement)
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
      setSelectedElement(newImageElement.id)
      
    } catch (error) {
      console.error('Image upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }, [onLayoutChange, recordHistory])

  const handleSelectElement = useCallback((elementId: string) => {
    setSelectedElement(elementId)
  }, [])

  const handleToggleVisible = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const element = updatedLayout.elements.find(el => el.id === elementId)
    if (element) {
      element.visible = !element.visible
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [onLayoutChange, recordHistory])

  const handleToggleLock = useCallback((elementId: string) => {
    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const element = updatedLayout.elements.find(el => el.id === elementId)
    if (element) {
      element.locked = !element.locked
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [onLayoutChange, recordHistory])

  const handleStyleChange = useCallback((property: string, value: any) => {
    if (!selectedElement) return

    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const element = updatedLayout.elements.find(el => el.id === selectedElement)
    if (element) {
      if (!element.style) {
        element.style = {}
      }
      (element.style as any)[property] = value
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [selectedElement, onLayoutChange, recordHistory])

  const handleTextChange = useCallback((text: string) => {
    if (!selectedElement) return

    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const element = updatedLayout.elements.find(el => el.id === selectedElement)
    if (element && !element.binding) {
      element.text = text
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [selectedElement, onLayoutChange, recordHistory])

  const handleCenterElement = useCallback((elementId?: string) => {
    const idToCenter = elementId || selectedElement
    if (!idToCenter) return
    const updatedLayout = cloneLayout(latestLayoutRef.current)
    const element = updatedLayout.elements.find(el => el.id === idToCenter)
    if (element) {
      element.x = Math.round((CANVAS_WIDTH - element.width) / 2)
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
    }
  }, [selectedElement, onLayoutChange, recordHistory])

  const handleReset = useCallback(() => {
    if (confirm('Reset canvas to the official AutoLearn Luxury Parchment Template?\n\nThis will restore all 15 elements (bold brandmark, gold seal medal, real signature, scannable QR verification card, student name, and course title) to their perfected coordinates and typography.')) {
      const def = resetToDefault()
      latestLayoutRef.current = def
      onLayoutChange(def)
      recordHistory(def)
      setSelectedElement(null)
    }
  }, [onLayoutChange, recordHistory])

  const handleDeleteElement = useCallback((elementId: string) => {
    if (confirm('Are you sure you want to delete this element?')) {
      const updatedLayout = cloneLayout(latestLayoutRef.current)
      updatedLayout.elements = updatedLayout.elements.filter(el => el.id !== elementId)
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
      if (selectedElement === elementId) {
        setSelectedElement(null)
      }
      if (selectedElements.includes(elementId)) {
        setSelectedElements(prev => prev.filter(id => id !== elementId))
      }
    }
  }, [selectedElement, selectedElements, onLayoutChange, recordHistory])

  const handleCopy = useCallback(() => {
    if (selectedElement) {
      const element = latestLayoutRef.current.elements.find(el => el.id === selectedElement)
      if (element) {
        setClipboard(JSON.parse(JSON.stringify(element)))
      }
    }
  }, [selectedElement])

  const handlePaste = useCallback(() => {
    if (clipboard) {
      const updatedLayout = cloneLayout(latestLayoutRef.current)
      const newElement = JSON.parse(JSON.stringify(clipboard))
      newElement.id = `${clipboard.id}_copy_${Date.now()}`
      newElement.x = Math.min(CANVAS_WIDTH - newElement.width, newElement.x + 20)
      newElement.y = Math.min(CANVAS_HEIGHT - newElement.height, newElement.y + 20)
      updatedLayout.elements.push(newElement)
      latestLayoutRef.current = updatedLayout
      onLayoutChange(updatedLayout)
      recordHistory(updatedLayout)
      setSelectedElement(newElement.id)
    }
  }, [clipboard, onLayoutChange, recordHistory])

  const handleDuplicate = useCallback(() => {
    if (selectedElement) {
      const element = latestLayoutRef.current.elements.find(el => el.id === selectedElement)
      if (element) {
        const updatedLayout = cloneLayout(latestLayoutRef.current)
        const newElement = JSON.parse(JSON.stringify(element))
        newElement.id = `${element.id}_copy_${Date.now()}`
        newElement.x = Math.min(CANVAS_WIDTH - newElement.width, newElement.x + 20)
        newElement.y = Math.min(CANVAS_HEIGHT - newElement.height, newElement.y + 20)
        updatedLayout.elements.push(newElement)
        latestLayoutRef.current = updatedLayout
        onLayoutChange(updatedLayout)
        recordHistory(updatedLayout)
        setSelectedElement(newElement.id)
      }
    }
  }, [selectedElement, onLayoutChange, recordHistory])

  // Universal Keyboard Shortcuts (Windows & Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return
      if (editingText) return // Don't handle shortcuts while typing inside textarea

      const activeElement = document.activeElement
      const isInput = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
      if (isInput) return

      const key = e.key.toLowerCase()
      const isModifier = e.ctrlKey || e.metaKey

      // Undo: Ctrl+Z or Cmd+Z
      if (isModifier && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Redo: Ctrl+Y, Cmd+Shift+Z, Ctrl+Shift+Z
      if ((isModifier && e.shiftKey && key === 'z') || (isModifier && key === 'y')) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          e.preventDefault()
          handleDeleteElement(selectedElement)
        }
        return
      }

      // Copy: Ctrl+C or Cmd+C
      if (isModifier && key === 'c') {
        if (selectedElement) {
          e.preventDefault()
          handleCopy()
        }
        return
      }

      // Paste: Ctrl+V or Cmd+V
      if (isModifier && key === 'v') {
        e.preventDefault()
        handlePaste()
        return
      }

      // Duplicate: Ctrl+D or Cmd+D
      if (isModifier && key === 'd') {
        if (selectedElement) {
          e.preventDefault()
          handleDuplicate()
        }
        return
      }

      // Arrow keys for nudge
      if (selectedElement && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        const updatedLayout = cloneLayout(latestLayoutRef.current)
        const element = updatedLayout.elements.find(el => el.id === selectedElement)
        if (element) {
          const nudgeAmount = e.shiftKey ? 10 : 1
          switch (e.key) {
            case 'ArrowUp':
              element.y = Math.max(0, element.y - nudgeAmount)
              break
            case 'ArrowDown':
              element.y = Math.min(CANVAS_HEIGHT - element.height, element.y + nudgeAmount)
              break
            case 'ArrowLeft':
              element.x = Math.max(0, element.x - nudgeAmount)
              break
            case 'ArrowRight':
              element.x = Math.min(CANVAS_WIDTH - element.width, element.x + nudgeAmount)
              break
          }
          latestLayoutRef.current = updatedLayout
          onLayoutChange(updatedLayout)
          recordHistory(updatedLayout)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readOnly, editingText, selectedElement, handleUndo, handleRedo, handleDeleteElement, handleCopy, handlePaste, handleDuplicate, onLayoutChange, recordHistory])

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (!unsavedChanges || readOnly) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now - lastAutoSave >= 30000) {
        // Trigger save via parent's onSave function
        if (onSave) {
          onSave({ preventDefault: () => {} } as React.FormEvent)
        }
        setLastAutoSave(now)
        console.log('[CertificateDesigner] Auto-saved layout')
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [unsavedChanges, lastAutoSave, readOnly, onSave])

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
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    }
  }, [isPanning, panStart])

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Add new element
  const handleAddElement = useCallback((type: string) => {
    const updatedLayout = cloneLayout(layout)
    const newId = `${type}_${Date.now()}`
    
    let newElement: CertificateElement
    
    switch (type) {
      case 'seal':
        newElement = {
          id: 'seal',
          type: 'image',
          x: Math.round(CANVAS_WIDTH / 2 - 65),
          y: 535,
          width: 130,
          height: 150,
          rotation: 0,
          visible: true,
          locked: false,
          src: '/certificate-gold-seal.png',
          style: { objectFit: 'contain' },
          zIndex: 10,
        }
        break
      case 'logo':
        newElement = {
          id: 'logo',
          type: 'logo',
          x: 410,
          y: 48,
          width: 78,
          height: 78,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'logo',
          src: '/autolearn-brandmark-bold.png',
          style: { objectFit: 'contain' },
          zIndex: 10,
        }
        break
      case 'signature':
        newElement = {
          id: 'signature',
          type: 'signature',
          x: 740,
          y: 540,
          width: 180,
          height: 52,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'signatureUrl',
          src: '/signature-femi-real.png',
          style: { objectFit: 'contain' },
          zIndex: 10,
        }
        break
      case 'qrCode':
        newElement = {
          id: 'qrCode',
          type: 'qrCode',
          x: 1010,
          y: 545,
          width: 85,
          height: 95,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'qrData',
          zIndex: 10,
        }
        break
      case 'studentName':
        newElement = {
          id: 'studentName',
          type: 'studentName',
          x: 150,
          y: 260,
          width: 900,
          height: 65,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'studentName',
          text: 'Femi Adeleke',
          style: {
            color: '#045a38',
            fontSize: 58,
            fontFamily: 'Playfair Display',
            fontWeight: 800,
            fontStyle: 'italic',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'course':
        newElement = {
          id: 'course',
          type: 'course',
          x: 150,
          y: 462,
          width: 900,
          height: 52,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'course',
          text: 'AI Automation with n8n',
          style: {
            color: '#0f172a',
            fontSize: 36,
            fontWeight: 900,
            fontFamily: 'Playfair Display',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'date':
        newElement = {
          id: 'date',
          type: 'date',
          x: 90,
          y: 560,
          width: 220,
          height: 65,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'date',
          text: 'November 18, 2026',
          style: {
            color: '#0f172a',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'Playfair Display',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'title':
        newElement = {
          id: 'title',
          type: 'title',
          x: 150,
          y: 136,
          width: 900,
          height: 50,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'title',
          text: 'CERTIFICATE OF COMPLETION',
          style: {
            color: '#0f172a',
            fontSize: 42,
            fontWeight: 900,
            fontFamily: 'Playfair Display',
            textAlign: 'center',
            letterSpacing: '3.5px',
          },
          zIndex: 10,
        }
        break
      case 'subtitle':
        newElement = {
          id: 'subtitle',
          type: 'subtitle',
          x: 150,
          y: 218,
          width: 900,
          height: 30,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'subtitle',
          text: 'This certificate is proudly presented to',
          style: {
            color: '#334155',
            fontSize: 19,
            fontFamily: 'Georgia',
            fontStyle: 'italic',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'bodyText':
        newElement = {
          id: 'bodyText',
          type: 'bodyText',
          x: 150,
          y: 416,
          width: 900,
          height: 30,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'bodyText',
          text: 'In Recognition of Completing the',
          style: {
            color: '#334155',
            fontSize: 19,
            fontFamily: 'Georgia',
            fontStyle: 'italic',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'founderName':
        newElement = {
          id: 'founderName',
          type: 'founderName',
          x: 740,
          y: 600,
          width: 180,
          height: 24,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'founderName',
          text: 'A. Femi Adeleke',
          style: {
            color: '#0f172a',
            fontSize: 16,
            fontFamily: 'Playfair Display',
            fontWeight: 800,
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'signatureText':
        newElement = {
          id: 'signatureText',
          type: 'signatureText',
          x: 740,
          y: 624,
          width: 180,
          height: 20,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'signatureText',
          text: 'Founder & Lead Instructor',
          style: {
            color: '#64748b',
            fontSize: 13,
            fontFamily: 'Georgia',
            fontStyle: 'italic',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'certificateId':
        newElement = {
          id: 'certificateId',
          type: 'certificateId',
          x: 990,
          y: 45,
          width: 150,
          height: 26,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'certificateId',
          style: {
            color: '#475569',
            fontSize: 11,
            fontFamily: 'monospace',
            fontWeight: 700,
            textAlign: 'center',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
          },
          zIndex: 10,
        }
        break
      case 'footer':
        newElement = {
          id: 'footer',
          type: 'footer',
          x: 150,
          y: 752,
          width: 900,
          height: 24,
          rotation: 0,
          visible: true,
          locked: false,
          binding: 'footer',
          text: 'AutoLearn Spot • Learn • Automate • Succeed',
          style: {
            color: '#475569',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textAlign: 'center',
          },
          zIndex: 10,
        }
        break
      case 'text':
        newElement = {
          id: newId,
          type: 'text',
          x: CANVAS_WIDTH / 2 - 150,
          y: CANVAS_HEIGHT / 2,
          width: 300,
          height: 40,
          rotation: 0,
          visible: true,
          locked: false,
          text: 'Custom Text',
          style: {
            fontSize: 20,
            color: '#0f172a',
            textAlign: 'center',
            fontFamily: 'Playfair Display',
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
      case 'line':
      case 'divider':
      case 'shape':
        newElement = {
          id: `shape_line_${Date.now()}`,
          type: 'line',
          x: Math.round(CANVAS_WIDTH / 2 - 170),
          y: Math.round(CANVAS_HEIGHT / 2 - 2),
          width: 340,
          height: 3,
          rotation: 0,
          visible: true,
          locked: false,
          style: {
            background: '#047857',
            borderRadius: 2,
            opacity: 1,
          },
        }
        break
      case 'rect':
      case 'box':
        newElement = {
          id: `shape_rect_${Date.now()}`,
          type: 'shape',
          x: Math.round(CANVAS_WIDTH / 2 - 110),
          y: Math.round(CANVAS_HEIGHT / 2 - 60),
          width: 220,
          height: 120,
          rotation: 0,
          visible: true,
          locked: false,
          style: {
            background: 'transparent',
            border: '2px solid #047857',
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: '#047857',
            borderRadius: 6,
            opacity: 1,
          },
        }
        break
      case 'pill':
      case 'badge':
        newElement = {
          id: `shape_pill_${Date.now()}`,
          type: 'badge',
          x: Math.round(CANVAS_WIDTH / 2 - 90),
          y: Math.round(CANVAS_HEIGHT / 2 - 18),
          width: 180,
          height: 36,
          rotation: 0,
          visible: true,
          locked: false,
          style: {
            background: '#04785715',
            border: '1.5px solid #047857',
            borderWidth: 1.5,
            borderStyle: 'solid',
            borderColor: '#047857',
            borderRadius: 9999,
            opacity: 1,
          },
        }
        break
      default:
        return
    }
    
    const existingIndex = updatedLayout.elements.findIndex(el => el.id === newElement.id)
    if (existingIndex >= 0) {
      updatedLayout.elements[existingIndex] = { ...newElement, visible: true }
      setSelectedElement(newElement.id)
    } else {
      updatedLayout.elements.push(newElement)
      setSelectedElement(newElement.id)
    }
    latestLayoutRef.current = updatedLayout
    onLayoutChange(updatedLayout)
    recordHistory(updatedLayout)
  }, [layout, onLayoutChange, recordHistory])

  const selectedElementData = layout.elements.find(el => el.id === selectedElement)

  return (
    <div className="flex flex-col h-screen bg-brand-bg">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-brand-bg border-b border-brand-border">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-[#10b981]" />
          <h2 className="text-lg font-semibold text-brand-text">Certificate Designer v2.0</h2>
          {unsavedChanges && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
              Unsaved changes
              {lastAutoSave > 0 && (
                <span className="ml-2 text-yellow-400/60">
                  (Auto-saved {Math.floor((Date.now() - lastAutoSave) / 1000)}s ago)
                </span>
              )}
            </span>
          )}
          {selectedElements.length > 1 && (
            <span className="px-2 py-1 bg-brand-bg/20 text-[#10b981] text-xs rounded">
              {selectedElements.length} selected
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo || readOnly}
            className="p-2 bg-brand-bg text-brand-text/60 rounded hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo || readOnly}
            className="p-2 bg-brand-bg text-brand-text/60 rounded hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-brand-bg" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 bg-brand-bg text-brand-text/60 rounded hover:bg-neutral-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm text-brand-text/60 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 bg-brand-bg text-brand-text/60 rounded hover:bg-neutral-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-2 bg-brand-bg text-brand-text/60 rounded hover:bg-neutral-200 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-brand-bg" />
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded transition-colors ${showGrid ? 'bg-brand-bg/20 text-[#10b981]' : 'bg-brand-bg text-brand-text/60 hover:bg-neutral-200'}`}
            title="Toggle Grid"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded transition-colors ${snapToGrid ? 'bg-brand-bg/20 text-[#10b981]' : 'bg-brand-bg text-brand-text/60 hover:bg-neutral-200'}`}
            title="Toggle Snap to Grid"
          >
            <Layers className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-brand-bg" />
          {selectedElement && (
            <button
              type="button"
              onClick={() => handleCenterElement()}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-sm rounded font-medium hover:bg-emerald-500/20 transition-colors"
              title="Center selected element horizontally on canvas"
            >
              <AlignCenter className="h-4 w-4" />
              <span>Center</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-bg text-brand-text/70 text-sm rounded hover:bg-neutral-200 hover:text-brand-text transition-colors border border-brand-border"
            title="Restore official Luxury Parchment template"
          >
            <RotateCcw className="h-4 w-4 text-emerald-600" />
            <span>Reset to Template</span>
          </button>
          <button
            type="button"
            onClick={handleValidateLayout}
            className={`px-3 py-2 text-sm rounded transition-colors ${validationMode ? 'bg-green-500/20 text-green-400' : 'bg-brand-bg text-brand-text/60 hover:bg-neutral-200'}`}
          >
            Validate
          </button>
          <button
            type="button"
            onClick={handleSaveAsTemplate}
            className="px-3 py-2 bg-brand-bg text-brand-text/60 text-sm rounded hover:bg-neutral-200 transition-colors"
          >
            Save as Template
          </button>
          <button
            type="button"
            onClick={handleExportPreview}
            className="px-3 py-2 bg-brand-bg text-brand-text/60 text-sm rounded hover:bg-neutral-200 transition-colors"
          >
            Export Preview
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white text-sm rounded font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
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
          className={`bg-brand-bg border-r border-brand-border flex flex-col ${leftSidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: leftSidebarCollapsed ? 48 : leftSidebarWidth }}
        >
          <div className="flex items-center justify-between p-2 border-b border-brand-border">
            <button
              type="button"
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="text-brand-text/60 hover:bg-brand-bg p-1 rounded"
            >
              {leftSidebarCollapsed ? <ChevronDown className="h-4 w-4 rotate-90" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {!leftSidebarCollapsed && (
              <div 
                className="w-2 h-8 bg-brand-bg cursor-col-resize hover:bg-brand-bg rounded"
                onMouseDown={(e) => handlePanelResizeStart('left', e)}
              />
            )}
          </div>
          
          {!leftSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Official Certificate Elements */}
              <div>
                <h3 className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>Certificate Elements</span>
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddElement('seal')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <Award className="h-4 w-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">3D Gold Seal Medal</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Official gold ribbon badge</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('logo')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">AutoLearn Brandmark</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Official logo header</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('signature')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <PenTool className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Founder Signature</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Authentic ink signature</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('qrCode')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <QrCode className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">QR Verification Card</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Live scannable card</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('studentName')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <User className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Student Name Field</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Dynamic recipient title</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('course')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Course Title Field</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Dynamic certified course</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('date')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <Calendar className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Issue Date Field</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Underlined calendar block</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('title')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Certificate Title</div>
                      <div className="text-[10px] text-brand-text/50 truncate">"Certificate of Completion"</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('certificateId')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Certificate ID Pill</div>
                      <div className="text-[10px] text-brand-text/50 truncate">Top-right serial badge</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('founderName')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <User className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Founder Name</div>
                      <div className="text-[10px] text-brand-text/50 truncate">A. Femi Adeleke</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('footer')}
                    className="w-full flex items-center gap-2.5 p-2 bg-brand-bg/80 border border-brand-border rounded-lg hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-text truncate">Bottom Motto</div>
                      <div className="text-[10px] text-brand-text/50 truncate">AutoLearn Spot • Motto</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Elements */}
              <div className="border-t border-brand-border pt-3">
                <h3 className="text-[11px] font-bold text-brand-text/60 uppercase tracking-wider mb-2">Custom Additions</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddElement('text')}
                    className="flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all"
                    title="Add Text Element"
                  >
                    <Type className="h-4 w-4 text-[#10b981] mb-1" />
                    <span className="text-xs text-brand-text font-medium">Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('line')}
                    className="flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all"
                    title="Add Horizontal Line / Divider"
                  >
                    <Minus className="h-4 w-4 text-[#10b981] mb-1" />
                    <span className="text-xs text-brand-text font-medium">Line</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('rect')}
                    className="flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all"
                    title="Add Box / Rectangle"
                  >
                    <Square className="h-4 w-4 text-[#10b981] mb-1" />
                    <span className="text-xs text-brand-text font-medium">Box</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('pill')}
                    className="flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all"
                    title="Add Rounded Pill / Badge Shape"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#10b981] mb-1" />
                    <span className="text-xs text-brand-text font-medium">Badge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddElement('image')}
                    className="flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all"
                    title="Add Image Placeholder"
                  >
                    <Image className="h-4 w-4 text-[#10b981] mb-1" />
                    <span className="text-xs text-brand-text font-medium">Image</span>
                  </button>

                  <label className={`flex flex-col items-center justify-center p-2.5 bg-brand-bg rounded-lg border border-brand-border hover:border-emerald-500 text-center transition-all cursor-pointer ${uploadingImage || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} title="Upload Custom Graphic">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 text-[#10b981] animate-spin mb-1" />
                    ) : (
                      <Upload className="h-4 w-4 text-[#10b981] mb-1" />
                    )}
                    <span className="text-xs text-brand-text font-medium">{uploadingImage ? 'Uploading' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                      className="hidden"
                      disabled={uploadingImage || readOnly}
                    />
                  </label>
                </div>
              </div>

              {/* Template Reset Shortcut */}
              <div className="border-t border-brand-border pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-600/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-600/20 text-xs font-bold transition-all shadow-2xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Official Template</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Center Canvas */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 bg-brand-bg overflow-hidden relative"
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
              className="relative bg-brand-bg border border-brand-border"
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
              
            >
              {/* Background */}
              <img
                src={settings.backgroundUrl || layout.canvas?.backgroundSrc || '/certificate-template-parchment-clean.png'}
                alt="Certificate background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              />

              {/* Alignment Guides */}
              {alignmentGuides.horizontal.map((y, index) => (
                <div
                  key={`h-${index}`}
                  className="absolute left-0 right-0 bg-emerald-500 pointer-events-none"
                  style={{ top: y, height: '1px', opacity: 0.6 }}
                />
              ))}
              {alignmentGuides.vertical.map((x, index) => (
                <div
                  key={`v-${index}`}
                  className="absolute top-0 bottom-0 bg-emerald-500 pointer-events-none"
                  style={{ left: x, width: '1px', opacity: 0.6 }}
                />
              ))}

              {/* Elements */}
              {layout.elements.map((element) => {
                const isSelected = selectedElement === element.id
                const displayText = getElementText(element, DEMO_CERTIFICATE_DATA, settings)
                const displaySrc = getElementSrc(element, settings) || 
                  (element.id === 'seal' || (element as any).type === 'seal' ? '/certificate-gold-seal.png' :
                   element.type === 'logo' ? '/autolearn-brandmark-bold.png' :
                   element.type === 'signature' ? '/signature-femi-real.png' : undefined)

                const isShapeElement = ['shape', 'divider', 'line', 'badge'].includes(element.type) || element.id?.startsWith('shape_') || element.id?.startsWith('divider_') || element.id?.startsWith('line_') || element.id?.startsWith('box_') || element.id?.startsWith('badge_')
                const isTextElement = !isShapeElement && ['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(element.type)
                const isImageElement = ['logo', 'signature', 'image'].includes(element.type) || element.id === 'seal'
                const isQrElement = element.type === 'qrCode'
                const isDynamic = ['studentName', 'course', 'date', 'certificateId'].includes(element.id) || ['studentName', 'course', 'date', 'certificateId'].includes(element.type)

                return (
                  <div
                    key={element.id}
                    className={`absolute ${isSelected || selectedElements.includes(element.id) ? 'ring-2 ring-emerald-600 bg-emerald-50/15' : ''} ${element.locked ? 'opacity-75' : ''}`}
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
                    {isShapeElement && (
                      <div
                        className="w-full h-full pointer-events-none select-none"
                        style={{
                          backgroundColor: element.style?.background || (element.type === 'line' ? '#047857' : 'transparent'),
                          border: element.style?.border || (element.style?.borderWidth ? `${element.style.borderWidth}px ${element.style?.borderStyle || 'solid'} ${element.style?.borderColor || '#047857'}` : 'none'),
                          borderRadius: element.style?.borderRadius || 0,
                          opacity: element.style?.opacity ?? 1,
                        }}
                      />
                    )}
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
                          className="w-full h-full bg-transparent text-slate-900 resize-none outline-none"
                          style={{
                            fontFamily: element.style?.fontFamily || 'Playfair Display, Georgia, serif',
                            fontSize: element.style?.fontSize || 16,
                            fontWeight: element.style?.fontWeight || 700,
                            fontStyle: element.style?.fontStyle || 'normal',
                            color: element.style?.color || '#0f172a',
                            textAlign: element.style?.textAlign || 'left',
                            lineHeight: element.style?.lineHeight || 1.15,
                            letterSpacing: element.style?.letterSpacing || 0,
                            whiteSpace: 'pre-wrap',
                            overflow: 'visible',
                            textShadow: element.style?.textShadow || 'none',
                          }}
                        />
                      ) : (
                        <div
                          onDoubleClick={() => handleElementDoubleClick(element)}
                          style={{
                            fontFamily: element.style?.fontFamily || 'Playfair Display, Georgia, serif',
                            fontSize: element.style?.fontSize || 16,
                            fontWeight: element.style?.fontWeight || 700,
                            fontStyle: element.style?.fontStyle || 'normal',
                            color: element.style?.color || '#0f172a',
                            textAlign: element.style?.textAlign || 'left',
                            lineHeight: element.style?.lineHeight || 1.15,
                            letterSpacing: element.style?.letterSpacing || 0,
                            whiteSpace: 'normal',
                            overflow: 'visible',
                            cursor: isDynamic ? 'default' : 'text',
                            textShadow: element.style?.textShadow || 'none',
                          }}
                        >
                          {element.id === 'date' || element.type === 'date' ? (
                            <div className="flex flex-col w-full h-full justify-between">
                              <div className="flex items-center gap-2 pb-1 border-b border-slate-300">
                                <span>{displayText}</span>
                              </div>
                              <span className="text-[12px] italic text-slate-500 font-serif">Date</span>
                            </div>
                          ) : element.id === 'brandTitle' && displayText === 'AUTOLEARN SPOT' ? (
                            <div className="flex items-baseline font-black tracking-wider">
                              <span className="text-slate-900">AUTOLEARN</span>
                              <span className="text-emerald-700 ml-2">SPOT</span>
                            </div>
                          ) : (
                            displayText
                          )}
                        </div>
                      )
                    )}
                    {isImageElement && displaySrc && (
                      <img
                        src={displaySrc}
                        alt={element.id}
                        className="w-full h-full object-contain pointer-events-none select-none"
                      />
                    )}
                    {isQrElement && (
                      <div className="w-full h-full bg-transparent flex flex-col items-center justify-center p-1 pointer-events-none select-none">
                        <img
                          src="/certificate-qr-sample.png"
                          alt="QR Code"
                          className="w-[85%] h-[85%] object-contain"
                        />
                        <span className="text-[9.5px] font-bold text-slate-700 tracking-tight leading-none mt-1">
                          Verify Certificate
                        </span>
                      </div>
                    )}
                    {isSelected && !readOnly && (
                      <>
                        {/* Selected Element ID & Position Pill */}
                        <div className="absolute -top-6 left-0 px-1.5 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-xs whitespace-nowrap pointer-events-none z-50 flex items-center gap-1">
                          <span>{element.id}</span>
                          <span className="opacity-75">({Math.round(element.x)}, {Math.round(element.y)})</span>
                        </div>

                        {/* High-visibility Resize handles */}
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-nwse-resize z-50"
                          style={{ top: -5, left: -5 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'nw')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-ns-resize z-50"
                          style={{ top: -5, left: '50%', transform: 'translateX(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'n')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-nesw-resize z-50"
                          style={{ top: -5, right: -5 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'ne')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-ew-resize z-50"
                          style={{ top: '50%', right: -5, transform: 'translateY(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'e')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-nwse-resize z-50"
                          style={{ bottom: -5, right: -5 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'se')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-ns-resize z-50"
                          style={{ bottom: -5, left: '50%', transform: 'translateX(-50%)' }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 's')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-nesw-resize z-50"
                          style={{ bottom: -5, left: -5 }}
                          onMouseDown={(e) => handleElementMouseDown(e, element, 'sw')}
                        />
                        <div
                          className="absolute w-2.5 h-2.5 bg-emerald-600 border border-white rounded-xs shadow-xs cursor-ew-resize z-50"
                          style={{ top: '50%', left: -5, transform: 'translateY(-50%)' }}
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
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-brand-bg border border-brand-border rounded-lg px-4 py-2">
            {validationMode && validationErrors.length > 0 && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-500/20 border border-red-500/50 rounded-lg p-3 min-w-[300px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-red-400">Validation Errors</h4>
                  <button
                    type="button"
                    onClick={() => setValidationMode(false)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
                <ul className="text-xs text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-brand-text/60 hover:text-brand-text"
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
              className="p-1 text-brand-text/60 hover:text-brand-text"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1 text-brand-text/60 hover:text-brand-text"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div 
          className={`bg-brand-bg border-l border-brand-border flex flex-col ${rightSidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: rightSidebarCollapsed ? 48 : rightSidebarWidth }}
        >
          <div className="flex items-center justify-between p-2 border-b border-brand-border">
            <button
              type="button"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="text-brand-text/60 hover:bg-brand-bg p-1 rounded"
            >
              {rightSidebarCollapsed ? <ChevronDown className="h-4 w-4 -rotate-90" /> : <ChevronDown className="h-4 w-4 -rotate-90" />}
            </button>
            {!rightSidebarCollapsed && (
              <div 
                className="w-2 h-8 bg-brand-bg cursor-col-resize hover:bg-brand-bg rounded"
                onMouseDown={(e) => handlePanelResizeStart('right', e)}
              />
            )}
          </div>
          
          {!rightSidebarCollapsed && (
            <div className="flex flex-col h-full">
              {/* Tabs */}
              <div className="flex border-b border-brand-border shrink-0">
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
                        ? 'bg-brand-bg/20 text-[#10b981] border-b-2 border-[#10b981]' 
                        : 'text-brand-text/60 hover:bg-brand-bg'
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
                      <h3 className="text-sm font-semibold text-brand-text">{selectedElementData.id}</h3>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(selectedElementData.id)}
                          className={`p-1.5 rounded transition-colors ${
                            selectedElementData.visible !== false 
                              ? 'bg-brand-bg/20 text-[#10b981] hover:bg-brand-bg/30' 
                              : 'bg-brand-bg text-brand-text/60 hover:bg-neutral-200'
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
                              : 'bg-brand-bg text-brand-text/60 hover:bg-neutral-200'
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
                        <button
                          type="button"
                          onClick={() => handleCenterElement(selectedElementData.id)}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <AlignCenter className="h-3.5 w-3.5" />
                          <span>Center Horizontally on Canvas</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-brand-text/60 mb-1">X</label>
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
                              className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-brand-text/60 mb-1">Y</label>
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
                              className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-brand-text/60 mb-1">
                              {selectedElementData.type === 'line' ? 'Length (Width)' : 'Width'}
                            </label>
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
                              className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-brand-text/60 mb-1">
                              {selectedElementData.type === 'line' ? 'Thickness (Height)' : 'Height'}
                            </label>
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
                              className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Rotation</label>
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
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    )}

                    {/* Style Tab */}
                    {activeTab === 'style' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Opacity</label>
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs text-brand-text/60">Background Color</label>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('background', 'transparent')}
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              Clear (Transparent)
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.background || '#000000'}
                              onChange={(e) => handleStyleChange('background', e.target.value)}
                              className="h-8 w-10 rounded border border-brand-border cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.background || '#000000'}
                              onChange={(e) => handleStyleChange('background', e.target.value)}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { color: '#047857', label: 'Emerald' },
                              { color: '#045a38', label: 'Forest Green' },
                              { color: '#b45309', label: 'Warm Amber' },
                              { color: '#d97706', label: 'Rich Gold' },
                              { color: '#0f172a', label: 'Dark Slate' },
                              { color: '#334155', label: 'Slate Gray' },
                              { color: '#cbd5e1', label: 'Muted Gray' },
                              { color: '#ffffff', label: 'Pure White' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleStyleChange('background', c.color)}
                                style={{ backgroundColor: c.color }}
                                className="w-5 h-5 rounded-full border border-brand-border shadow-2xs hover:scale-110 transition-transform"
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Corner Rounding (Radius)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={selectedElementData.style?.borderRadius ?? 0}
                              onChange={(e) => handleStyleChange('borderRadius', Number(e.target.value))}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                              min="0"
                              max="9999"
                              step="1"
                            />
                            <button
                              type="button"
                              onClick={() => handleStyleChange('borderRadius', 9999)}
                              className="px-2.5 py-1.5 bg-brand-bg border border-brand-border rounded text-xs text-brand-text hover:bg-neutral-200"
                            >
                              Pill
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStyleChange('borderRadius', 0)}
                              className="px-2.5 py-1.5 bg-brand-bg border border-brand-border rounded text-xs text-brand-text hover:bg-neutral-200"
                            >
                              Sharp
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Border Width</label>
                          <input
                            type="number"
                            value={selectedElementData.style?.borderWidth ?? 0}
                            onChange={(e) => {
                              const width = Number(e.target.value)
                              const color = selectedElementData.style?.borderColor || '#f5f5f5'
                              handleStyleChange('borderWidth', width)
                              handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                            }}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                            min="0"
                            step="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Border Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.borderColor || '#f5f5f5'}
                              onChange={(e) => {
                                const color = e.target.value
                                const width = selectedElementData.style?.borderWidth || 0
                                handleStyleChange('borderColor', color)
                                handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                              }}
                              className="h-8 w-10 rounded border border-brand-border cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.borderColor || '#f5f5f5'}
                              onChange={(e) => {
                                const color = e.target.value
                                const width = selectedElementData.style?.borderWidth || 0
                                handleStyleChange('borderColor', color)
                                handleStyleChange('border', width > 0 ? `${width}px solid ${color}` : 'none')
                              }}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { color: '#047857', label: 'Emerald' },
                              { color: '#045a38', label: 'Forest Green' },
                              { color: '#b45309', label: 'Warm Amber' },
                              { color: '#d97706', label: 'Rich Gold' },
                              { color: '#0f172a', label: 'Dark Slate' },
                              { color: '#334155', label: 'Slate Gray' },
                              { color: '#cbd5e1', label: 'Muted Gray' },
                              { color: '#ffffff', label: 'Pure White' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  const width = selectedElementData.style?.borderWidth || 1
                                  handleStyleChange('borderColor', c.color)
                                  handleStyleChange('borderWidth', width)
                                  handleStyleChange('border', `${width}px solid ${c.color}`)
                                }}
                                style={{ backgroundColor: c.color }}
                                className="w-5 h-5 rounded-full border border-brand-border shadow-2xs hover:scale-110 transition-transform"
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Tab */}
                    {activeTab === 'text' && (['title', 'subtitle', 'studentName', 'bodyText', 'course', 'date', 'signatureText', 'founderName', 'certificateId', 'footer', 'text'].includes(selectedElementData.type) || selectedElementData.id === 'brandTitle') && (
                      <div className="space-y-3">
                        {(() => {
                          const isDynamicCredField = ['studentName', 'course', 'date', 'certificateId'].includes(selectedElementData.id) || ['studentName', 'course', 'date', 'certificateId'].includes(selectedElementData.type)

                          if (!isDynamicCredField) {
                            return (
                              <div>
                                <label className="block text-xs font-semibold text-brand-text mb-1">Text Content</label>
                                <textarea
                                  value={selectedElementData.text || ''}
                                  onChange={(e) => handleTextChange(e.target.value)}
                                  className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                  disabled={readOnly}
                                  rows={2}
                                  placeholder="Enter certificate text..."
                                />
                              </div>
                            )
                          }

                          return (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-2">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Dynamic Credential Field ({selectedElementData.id})</span>
                              </div>
                              <p className="text-brand-text/70 leading-relaxed text-[11px]">
                                Automatically generated for each student when they complete this course.
                              </p>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-text/60 mb-1">Sample Preview Text</label>
                                <input
                                  type="text"
                                  value={selectedElementData.text || ''}
                                  onChange={(e) => handleTextChange(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-brand-bg border border-brand-border rounded text-xs text-brand-text"
                                  disabled={readOnly}
                                  placeholder="Sample preview..."
                                />
                              </div>
                            </div>
                          )
                        })()}
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Font Family</label>
                          <select
                            value={selectedElementData.style?.fontFamily || 'Roboto'}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          >
                            <option value="Playfair Display">Playfair Display (Serif Luxury)</option>
                            <option value="Georgia">Georgia (Classic Serif)</option>
                            <option value="Times New Roman">Times New Roman (Formal)</option>
                            <option value="Roboto">Roboto (Clean Sans)</option>
                            <option value="Inter">Inter (Modern Sans)</option>
                            <option value="Montserrat">Montserrat (Bold Sans)</option>
                            <option value="Poppins">Poppins (Geometric Sans)</option>
                            <option value="monospace">Monospace (Code / ID)</option>
                            <option value="system-ui">system-ui (Native)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Font Size</label>
                          <input
                            type="number"
                            value={selectedElementData.style?.fontSize || 12}
                            onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Font Weight</label>
                          <select
                            value={selectedElementData.style?.fontWeight || 400}
                            onChange={(e) => handleStyleChange('fontWeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
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
                          <label className="block text-xs text-brand-text/60 mb-1">Font Style</label>
                          <select
                            value={selectedElementData.style?.fontStyle || 'normal'}
                            onChange={(e) => handleStyleChange('fontStyle', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Text Transform</label>
                          <select
                            value={selectedElementData.style?.textTransform || 'none'}
                            onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          >
                            <option value="none">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="capitalize">Capitalize</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Text Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.color || '#0f172a'}
                              onChange={(e) => handleStyleChange('color', e.target.value)}
                              className="h-8 w-10 rounded border border-brand-border cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.color || '#f5f5f5'}
                              onChange={(e) => handleStyleChange('color', e.target.value)}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { color: '#0f172a', label: 'Dark Slate' },
                              { color: '#047857', label: 'Emerald' },
                              { color: '#045a38', label: 'Forest Green' },
                              { color: '#b45309', label: 'Warm Amber' },
                              { color: '#334155', label: 'Slate Gray' },
                              { color: '#475569', label: 'Muted Gray' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleStyleChange('color', c.color)}
                                style={{ backgroundColor: c.color }}
                                className="w-5 h-5 rounded-full border border-brand-border shadow-2xs hover:scale-110 transition-transform"
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Text Shadow</label>
                          <input
                            type="text"
                            value={selectedElementData.style?.textShadow ?? '0 2px 8px rgba(0,0,0,0.78)'}
                            onChange={(e) => handleStyleChange('textShadow', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                            placeholder="0 2px 8px rgba(0,0,0,0.78)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Outline Width</label>
                          <input
                            type="number"
                            value={selectedElementData.style?.outlineWidth || 0}
                            onChange={(e) => handleStyleChange('outlineWidth', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Outline Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.outlineColor || '#f5f5f5'}
                              onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                              className="h-8 w-10 rounded border border-brand-border cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.outlineColor || '#f5f5f5'}
                              onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { color: '#0f172a', label: 'Dark Slate' },
                              { color: '#047857', label: 'Emerald' },
                              { color: '#045a38', label: 'Forest Green' },
                              { color: '#b45309', label: 'Warm Amber' },
                              { color: '#334155', label: 'Slate Gray' },
                              { color: '#475569', label: 'Muted Gray' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleStyleChange('color', c.color)}
                                style={{ backgroundColor: c.color }}
                                className="w-5 h-5 rounded-full border border-brand-border shadow-2xs hover:scale-110 transition-transform"
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Text Align</label>
                          <div className="flex gap-1">
                            {['left', 'center', 'right'].map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => handleStyleChange('textAlign', align)}
                                className={`flex-1 p-2 rounded border ${
                                  selectedElementData.style?.textAlign === align
                                    ? 'bg-brand-bg border-[#10b981] text-[#00363a]'
                                    : 'bg-[var(--card)] brightness-95 border-brand-border text-brand-text/60 hover:border-[#10b981]'
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
                          <label className="block text-xs text-brand-text/60 mb-1">Line Height</label>
                          <input
                            type="number"
                            step="0.1"
                            value={selectedElementData.style?.lineHeight || 1}
                            onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Letter Spacing</label>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElementData.style?.letterSpacing || 0}
                            onChange={(e) => handleStyleChange('letterSpacing', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Line Height</label>
                          <input
                            type="number"
                            step="0.1"
                            value={selectedElementData.style?.lineHeight || 1}
                            onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Outline Width</label>
                          <input
                            type="number"
                            value={selectedElementData.style?.outlineWidth || 0}
                            onChange={(e) => handleStyleChange('outlineWidth', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                            disabled={readOnly}
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-brand-text/60 mb-1">Outline Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedElementData.style?.outlineColor || '#f5f5f5'}
                              onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                              className="h-8 w-10 rounded border border-brand-border cursor-pointer"
                              disabled={readOnly}
                            />
                            <input
                              type="text"
                              value={selectedElementData.style?.outlineColor || '#f5f5f5'}
                              onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
                              className="flex-1 px-3 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded text-sm text-brand-text"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[
                              { color: '#0f172a', label: 'Dark Slate' },
                              { color: '#047857', label: 'Emerald' },
                              { color: '#045a38', label: 'Forest Green' },
                              { color: '#b45309', label: 'Warm Amber' },
                              { color: '#334155', label: 'Slate Gray' },
                              { color: '#475569', label: 'Muted Gray' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => handleStyleChange('color', c.color)}
                                style={{ backgroundColor: c.color }}
                                className="w-5 h-5 rounded-full border border-brand-border shadow-2xs hover:scale-110 transition-transform"
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Layers Tab */}
                    {activeTab === 'layers' && (
                      <div className="space-y-1">
                        {layout.elements.map((element, index) => (
                          <div
                            key={element.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                              selectedElement === element.id ? 'bg-brand-bg/20' : 'hover:bg-brand-bg'
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
                                  ? 'text-[#10b981] hover:bg-brand-bg/20' 
                                  : 'text-brand-text/60 hover:bg-brand-bg'
                              }`}
                              title={element.visible !== false ? 'Hide' : 'Show'}
                            >
                              {element.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </button>
                            <div className="flex-1 text-xs text-brand-text/60">{element.id}</div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveLayerUp(element.id)
                                }}
                                disabled={index === 0}
                                className={`p-1 rounded transition-colors ${
                                  index === 0 
                                    ? 'text-brand-text/60 opacity-30 cursor-not-allowed' 
                                    : 'text-brand-text/60 hover:bg-brand-bg'
                                }`}
                                title="Move Up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveLayerDown(element.id)
                                }}
                                disabled={index === layout.elements.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  index === layout.elements.length - 1 
                                    ? 'text-brand-text/60 opacity-30 cursor-not-allowed' 
                                    : 'text-brand-text/60 hover:bg-brand-bg'
                                }`}
                                title="Move Down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleLock(element.id)
                                }}
                                className={`p-1 rounded transition-colors ${
                                  element.locked 
                                    ? 'text-yellow-400 hover:bg-yellow-400/20' 
                                    : 'text-brand-text/60 hover:bg-brand-bg'
                                }`}
                                title={element.locked ? 'Unlock' : 'Lock'}
                              >
                                {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MousePointer2 className="h-8 w-8 text-brand-text/60 mx-auto mb-2" />
                    <p className="text-sm text-brand-text/60">Select an element to edit its properties</p>
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

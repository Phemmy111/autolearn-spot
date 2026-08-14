/**
 * Certificate Layout System for AutoLearn Spot
 * 
 * This module defines the data model and utilities for visual certificate layout design.
 * It provides a declarative way to position and style certificate elements.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * The type of certificate element
 */
export type CertificateElementType =
  | 'logo'
  | 'title'
  | 'subtitle'
  | 'studentName'
  | 'bodyText'
  | 'course'
  | 'date'
  | 'signature'
  | 'signatureText'
  | 'founderName'
  | 'qrCode'
  | 'certificateId'
  | 'footer'
  | 'custom'
  | 'image'
  | 'text'

/**
 * Data binding types for dynamic content
 */
export type CertificateBinding =
  | 'logo'
  | 'title'
  | 'subtitle'
  | 'bodyText'
  | 'studentName'
  | 'course'
  | 'date'
  | 'signatureUrl'
  | 'signatureText'
  | 'founderName'
  | 'qrData'
  | 'certificateId'
  | 'footer'
  | 'background'
  | 'accentColor'
  | null

/**
 * Style properties for certificate elements
 */
export interface CertificateElementStyle {
  color?: string
  fontSize?: number
  fontWeight?: number | string
  fontFamily?: string
  lineHeight?: number
  letterSpacing?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textAlign?: 'left' | 'center' | 'right'
  textShadow?: string
  opacity?: number
  background?: string
  border?: string
  borderRadius?: number
  padding?: number | string
  maxWidth?: number
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap'
  overflowWrap?: 'normal' | 'break-word' | 'anywhere'
}

/**
 * A single certificate element with position, size, and styling
 */
export interface CertificateElement {
  /** Unique identifier for the element */
  id: string
  
  /** Type of element */
  type: CertificateElementType
  
  /** Horizontal position in pixels from left edge */
  x: number
  
  /** Vertical position in pixels from top edge */
  y: number
  
  /** Width in pixels */
  width: number
  
  /** Height in pixels */
  height: number
  
  /** Rotation in degrees (0 = no rotation) */
  rotation: number
  
  /** Whether the element is visible */
  visible: boolean
  
  /** Whether the element is locked from editing */
  locked: boolean
  
  /** Static text content (for text elements) */
  text?: string
  
  /** Data binding for dynamic content */
  binding?: CertificateBinding
  
  /** Image source URL (for image/logo elements) */
  src?: string
  
  /** Style properties */
  style?: CertificateElementStyle
  
  /** Z-index for layering */
  zIndex?: number
}

/**
 * Canvas dimensions and settings
 */
export interface CertificateCanvas {
  /** Canvas width in pixels */
  width: number
  
  /** Canvas height in pixels */
  height: number
  
  /** Background image URL */
  backgroundSrc?: string
  
  /** Background color (fallback if no image) */
  backgroundColor?: string
  
  /** Accent color for highlights */
  accentColor?: string
}

/**
 * Complete certificate layout definition
 */
export interface CertificateLayout {
  /** Layout version for migration support */
  version: string
  
  /** Layout name/description */
  name: string
  
  /** Canvas settings */
  canvas: CertificateCanvas
  
  /** Array of certificate elements */
  elements: CertificateElement[]
  
  /** Optional metadata */
  metadata?: {
    createdAt?: string
    updatedAt?: string
    author?: string
    description?: string
  }
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CANVAS_WIDTH = 1200
export const DEFAULT_CANVAS_HEIGHT = 800
export const CURRENT_LAYOUT_VERSION = '1.0.0'

// ============================================================================
// Default Layout
// ============================================================================

/**
 * Default certificate layout matching the current CertificateTemplate.tsx positioning
 * 
 * Zone map for the 1200x800 artwork:
 * - Logo:             top centre (x: 569, y: 38, 62x62)
 * - Title:            top 148px, centered (x: 155, y: 148, 890x55)
 * - Subtitle:         top 153px, centered (x: 155, y: 153, 890x50)
 * - Student name:     top 218px, centered (x: 105, y: 218, 990x70)
 * - Body text:        top 298px, centered (x: 180, y: 298, 840x32)
 * - Course:           top 482px, centered (x: 125, y: 482, 950x82)
 * - Date:             bottom 101px, left 145px (x: 145, y: 699, 285x34)
 * - Signature:        bottom 87px, right 145px (x: 855, y: 713, 300x74)
 * - QR:               bottom 73px, right 42px, 52x52 (x: 1106, y: 727, 52x52)
 * - Certificate ID:   bottom 47px, right 62px (x: 893, y: 753, 245x16)
 * - Footer:           bottom 18px, centered (x: 140, y: 782, 920x18)
 */
export const DEFAULT_CERTIFICATE_LAYOUT: CertificateLayout = {
  version: CURRENT_LAYOUT_VERSION,
  name: 'Default AutoLearn Spot Certificate',
  canvas: {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    backgroundColor: '#06101f',
    accentColor: '#00e5ff',
  },
  elements: [
    // Logo - top center
    {
      id: 'logo',
      type: 'logo',
      x: 569,
      y: 38,
      width: 62,
      height: 62,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'logo',
      style: {
        objectFit: 'contain',
      },
      zIndex: 10,
    },

    // Title - inside upper gold frame
    {
      id: 'title',
      type: 'title',
      x: 155,
      y: 148,
      width: 890,
      height: 55,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'title',
      text: 'Certificate of Completion',
      style: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 700,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.05,
        letterSpacing: '1.35px',
        textTransform: 'uppercase',
        textAlign: 'center',
        textShadow: '0 2px 7px rgba(0,0,0,0.78)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Subtitle - below title
    {
      id: 'subtitle',
      type: 'subtitle',
      x: 155,
      y: 153,
      width: 890,
      height: 50,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'subtitle',
      text: 'This certifies that',
      style: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 11,
        fontWeight: 400,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.1,
        letterSpacing: '0.8px',
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Student Name - focal zone below title frame
    {
      id: 'studentName',
      type: 'studentName',
      x: 105,
      y: 218,
      width: 990,
      height: 70,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'studentName',
      text: 'Student Name',
      style: {
        color: '#ffffff',
        fontSize: 68,
        fontWeight: 400,
        fontFamily: '"GreatVibes", "Brush Script MT", cursive',
        lineHeight: 1,
        textAlign: 'center',
        textShadow: '0 3px 10px rgba(0,0,0,0.85)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Body Text - immediately below student name
    {
      id: 'bodyText',
      type: 'bodyText',
      x: 180,
      y: 298,
      width: 840,
      height: 32,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'bodyText',
      text: 'has successfully completed the',
      style: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 400,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.15,
        letterSpacing: '0.2px',
        textAlign: 'center',
        textShadow: '0 1px 5px rgba(0,0,0,0.78)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Course - inside large lower gold frame
    {
      id: 'course',
      type: 'course',
      x: 125,
      y: 482,
      width: 950,
      height: 82,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'course',
      text: 'n8n Automation',
      style: {
        color: '#00e5ff',
        fontSize: 24,
        fontWeight: 700,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.12,
        letterSpacing: '0.85px',
        textTransform: 'uppercase',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.82)',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
      zIndex: 10,
    },

    // Date - lower-left credential line
    {
      id: 'date',
      type: 'date',
      x: 145,
      y: 699,
      width: 285,
      height: 34,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'date',
      text: 'January 1, 2024',
      style: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.1,
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.72)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Signature Image - lower-right credential line
    {
      id: 'signature',
      type: 'signature',
      x: 855,
      y: 713,
      width: 300,
      height: 74,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'signatureUrl',
      style: {
        objectFit: 'contain',
      },
      zIndex: 10,
    },

    // Signature Text - below signature image
    {
      id: 'signatureText',
      type: 'signatureText',
      x: 855,
      y: 745,
      width: 300,
      height: 20,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'signatureText',
      text: 'Founder & Instructor',
      style: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 10,
        fontWeight: 400,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.1,
        letterSpacing: '0.45px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Founder Name - below signature text
    {
      id: 'founderName',
      type: 'founderName',
      x: 855,
      y: 767,
      width: 300,
      height: 20,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'founderName',
      text: 'Founder Name',
      style: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.1,
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.72)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // QR Code - bottom-right, small and subtle
    {
      id: 'qrCode',
      type: 'qrCode',
      x: 1106,
      y: 727,
      width: 52,
      height: 52,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'qrData',
      style: {
        background: '#ffffff',
        borderRadius: 2,
        opacity: 0.84,
      },
      zIndex: 10,
    },

    // Certificate ID - very subtle bottom-right
    {
      id: 'certificateId',
      type: 'certificateId',
      x: 893,
      y: 753,
      width: 245,
      height: 16,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'certificateId',
      text: 'CERT-12345',
      style: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 8,
        fontWeight: 400,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.15,
        letterSpacing: '0.35px',
        textAlign: 'right',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },

    // Footer - bottom center
    {
      id: 'footer',
      type: 'footer',
      x: 140,
      y: 782,
      width: 920,
      height: 18,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'footer',
      text: 'AutoLearn Spot - Excellence in Automation Education',
      style: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 10,
        fontWeight: 400,
        fontFamily: '"Roboto", Arial, sans-serif',
        lineHeight: 1.1,
        letterSpacing: '0.45px',
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
      },
      zIndex: 10,
    },
  ],
  metadata: {
    createdAt: new Date().toISOString(),
    description: 'Default layout matching the approved certificate artwork',
  },
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a certificate element
 */
export function validateElement(element: CertificateElement): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!element.id || typeof element.id !== 'string') {
    errors.push('Element must have a valid id')
  }

  if (!element.type || typeof element.type !== 'string') {
    errors.push('Element must have a valid type')
  }

  // Check position and size
  if (typeof element.x !== 'number' || element.x < 0) {
    errors.push('Element x must be a non-negative number')
  }

  if (typeof element.y !== 'number' || element.y < 0) {
    errors.push('Element y must be a non-negative number')
  }

  if (typeof element.width !== 'number' || element.width <= 0) {
    errors.push('Element width must be a positive number')
  }

  if (typeof element.height !== 'number' || element.height <= 0) {
    errors.push('Element height must be a positive number')
  }

  // Check rotation
  if (typeof element.rotation !== 'number') {
    errors.push('Element rotation must be a number')
  } else if (Math.abs(element.rotation) > 360) {
    warnings.push('Element rotation exceeds 360 degrees')
  }

  // Check boolean flags
  if (typeof element.visible !== 'boolean') {
    errors.push('Element visible must be a boolean')
  }

  if (typeof element.locked !== 'boolean') {
    errors.push('Element locked must be a boolean')
  }

  // Check binding validity
  if (element.binding !== undefined && element.binding !== null) {
    const validBindings: CertificateBinding[] = [
      'logo', 'title', 'subtitle', 'bodyText', 'studentName',
      'course', 'date', 'signatureUrl', 'signatureText', 'founderName',
      'qrData', 'certificateId', 'footer', 'background', 'accentColor',
    ]
    if (!validBindings.includes(element.binding)) {
      warnings.push(`Unknown binding: ${element.binding}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a complete certificate layout
 */
export function validateLayout(layout: CertificateLayout): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required fields
  if (!layout.version || typeof layout.version !== 'string') {
    errors.push('Layout must have a version')
  }

  if (!layout.name || typeof layout.name !== 'string') {
    errors.push('Layout must have a name')
  }

  if (!layout.canvas) {
    errors.push('Layout must have canvas configuration')
  } else {
    // Validate canvas
    if (typeof layout.canvas.width !== 'number' || layout.canvas.width <= 0) {
      errors.push('Canvas width must be a positive number')
    }

    if (typeof layout.canvas.height !== 'number' || layout.canvas.height <= 0) {
      errors.push('Canvas height must be a positive number')
    }
  }

  if (!Array.isArray(layout.elements)) {
    errors.push('Layout must have an elements array')
  } else {
    // Check for duplicate IDs
    const ids = layout.elements.map(e => e.id)
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate element IDs found: ${duplicateIds.join(', ')}`)
    }

    // Validate each element
    layout.elements.forEach((element, index) => {
      const result = validateElement(element)
      errors.push(...result.errors.map(e => `Element ${index} (${element.id}): ${e}`))
      warnings.push(...result.warnings.map(w => `Element ${index} (${element.id}): ${w}`))
    })

    // Check elements are within canvas bounds
    if (layout.canvas) {
      layout.elements.forEach((element, index) => {
        if (element.x + element.width > layout.canvas!.width) {
          warnings.push(`Element ${index} (${element.id}) extends beyond canvas width`)
        }
        if (element.y + element.height > layout.canvas!.height) {
          warnings.push(`Element ${index} (${element.id}) extends beyond canvas height`)
        }
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// Layout Management Functions
// ============================================================================

/**
 * Create a new empty layout
 */
export function createEmptyLayout(
  name: string = 'New Certificate Layout',
  width: number = DEFAULT_CANVAS_WIDTH,
  height: number = DEFAULT_CANVAS_HEIGHT,
): CertificateLayout {
  return {
    version: CURRENT_LAYOUT_VERSION,
    name,
    canvas: {
      width,
      height,
      backgroundColor: '#06101f',
      accentColor: '#00e5ff',
    },
    elements: [],
    metadata: {
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * Clone a layout
 */
export function cloneLayout(layout: CertificateLayout): CertificateLayout {
  return JSON.parse(JSON.stringify(layout))
}

/**
 * Add an element to a layout
 */
export function addElement(
  layout: CertificateLayout,
  element: CertificateElement,
): CertificateLayout {
  const newLayout = cloneLayout(layout)
  newLayout.elements.push(element)
  newLayout.metadata = {
    ...newLayout.metadata,
    updatedAt: new Date().toISOString(),
  }
  return newLayout
}

/**
 * Remove an element from a layout by ID
 */
export function removeElement(layout: CertificateLayout, elementId: string): CertificateLayout {
  const newLayout = cloneLayout(layout)
  newLayout.elements = newLayout.elements.filter(e => e.id !== elementId)
  newLayout.metadata = {
    ...newLayout.metadata,
    updatedAt: new Date().toISOString(),
  }
  return newLayout
}

/**
 * Update an element in a layout
 */
export function updateElement(
  layout: CertificateLayout,
  elementId: string,
  updates: Partial<CertificateElement>,
): CertificateLayout {
  const newLayout = cloneLayout(layout)
  const index = newLayout.elements.findIndex(e => e.id === elementId)
  
  if (index !== -1) {
    newLayout.elements[index] = {
      ...newLayout.elements[index],
      ...updates,
    }
    newLayout.metadata = {
      ...newLayout.metadata,
      updatedAt: new Date().toISOString(),
    }
  }
  
  return newLayout
}

/**
 * Move an element to a new position
 */
export function moveElement(
  layout: CertificateLayout,
  elementId: string,
  x: number,
  y: number,
): CertificateLayout {
  return updateElement(layout, elementId, { x, y })
}

/**
 * Resize an element
 */
export function resizeElement(
  layout: CertificateLayout,
  elementId: string,
  width: number,
  height: number,
): CertificateLayout {
  return updateElement(layout, elementId, { width, height })
}

/**
 * Rotate an element
 */
export function rotateElement(
  layout: CertificateLayout,
  elementId: string,
  rotation: number,
): CertificateLayout {
  return updateElement(layout, elementId, { rotation })
}

/**
 * Toggle element visibility
 */
export function toggleElementVisibility(layout: CertificateLayout, elementId: string): CertificateLayout {
  const element = layout.elements.find(e => e.id === elementId)
  if (element) {
    return updateElement(layout, elementId, { visible: !element.visible })
  }
  return layout
}

/**
 * Toggle element lock state
 */
export function toggleElementLock(layout: CertificateLayout, elementId: string): CertificateLayout {
  const element = layout.elements.find(e => e.id === elementId)
  if (element) {
    return updateElement(layout, elementId, { locked: !element.locked })
  }
  return layout
}

/**
 * Get an element by ID
 */
export function getElement(layout: CertificateLayout, elementId: string): CertificateElement | undefined {
  return layout.elements.find(e => e.id === elementId)
}

/**
 * Get elements by type
 */
export function getElementsByType(
  layout: CertificateLayout,
  type: CertificateElementType,
): CertificateElement[] {
  return layout.elements.filter(e => e.type === type)
}

/**
 * Get elements by binding
 */
export function getElementsByBinding(
  layout: CertificateLayout,
  binding: CertificateBinding,
): CertificateElement[] {
  return layout.elements.filter(e => e.binding === binding)
}

/**
 * Serialize a layout to JSON string
 */
export function serializeLayout(layout: CertificateLayout): string {
  return JSON.stringify(layout, null, 2)
}

/**
 * Deserialize a layout from JSON string
 */
export function deserializeLayout(json: string): CertificateLayout {
  return JSON.parse(json)
}

/**
 * Migrate a layout from an older version to the current version
 */
export function migrateLayout(layout: CertificateLayout): CertificateLayout {
  // If layout is already current version, return as-is
  if (layout.version === CURRENT_LAYOUT_VERSION) {
    return layout
  }

  // Add migration logic here for future versions
  // For now, just update the version number
  const newLayout = cloneLayout(layout)
  newLayout.version = CURRENT_LAYOUT_VERSION
  newLayout.metadata = {
    ...newLayout.metadata,
    updatedAt: new Date().toISOString(),
  }

  return newLayout
}

// ============================================================================
// Helper Functions for Designer
// ============================================================================

/**
 * Demo certificate data for preview purposes
 */
export const DEMO_CERTIFICATE_DATA = {
  name: 'John Doe',
  date: 'January 15, 2024',
  course: 'n8n Automation Masterclass',
  certificateId: 'ALS-2024-2-001',
  title: 'Certificate of Completion',
  subtitle: 'This certifies that',
  bodyText: 'has successfully completed the',
  founderName: 'AutoLearn Spot',
  signatureText: 'Founder & Instructor',
  footer: 'AutoLearn Spot - Excellence in Automation Education',
}

/**
 * Reset layout to default
 */
export function resetToDefault(): CertificateLayout {
  return cloneLayout(DEFAULT_CERTIFICATE_LAYOUT)
}

/**
 * Get display text for an element based on its binding
 */
export function getElementText(
  element: CertificateElement,
  data: Record<string, string>,
  settings: Record<string, string>,
): string {
  // If element has static text, use it
  if (element.text) {
    return element.text
  }

  // Otherwise, use binding to get dynamic text
  switch (element.binding) {
    case 'title':
      return settings.title || 'Certificate of Completion'
    case 'subtitle':
      return settings.subtitle || 'This certifies that'
    case 'bodyText':
      return settings.bodyText || 'has successfully completed the'
    case 'studentName':
      return data.student_name || 'Student Name'
    case 'course':
      return data.course || 'Course Name'
    case 'date':
      return data.issue_date || 'January 1, 2024'
    case 'signatureText':
      return settings.signatureText || 'Founder'
    case 'founderName':
      return settings.founderName || 'Founder Name'
    case 'certificateId':
      return data.certificate_id || 'CERT-12345'
    case 'footer':
      return settings.footer || 'Footer Text'
    default:
      return element.text || ''
  }
}

/**
 * Get display image source for an element based on its binding
 */
export function getElementSrc(
  element: CertificateElement,
  settings: Record<string, string>,
): string | undefined {
  switch (element.binding) {
    case 'logo':
      return settings.logoUrl || element.src
    case 'signatureUrl':
      return settings.signatureUrl || element.src
    case 'background':
      return settings.backgroundUrl || element.src
    default:
      return element.src
  }
}

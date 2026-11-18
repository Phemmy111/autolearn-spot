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
  fontStyle?: 'normal' | 'italic'
  lineHeight?: number
  letterSpacing?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textAlign?: 'left' | 'center' | 'right'
  textShadow?: string
  opacity?: number
  background?: string
  border?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number | string
  maxWidth?: number
  whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap'
  overflowWrap?: 'normal' | 'break-word' | 'anywhere'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  outlineWidth?: number
  outlineColor?: string
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
  name: 'Luxury Parchment AutoLearn Certificate',
  canvas: {
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    backgroundColor: '#fbf6ec',
    accentColor: '#047857',
    backgroundSrc: '/certificate-template-parchment-clean.png',
  },
  elements: [
    // 1. Official AutoLearn Brandmark Logo
    {
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
    },

    // 2. Brand Name Title: "AUTOLEARN SPOT"
    {
      id: 'brandTitle',
      type: 'text',
      x: 504,
      y: 50,
      width: 320,
      height: 40,
      rotation: 0,
      visible: true,
      locked: false,
      text: 'AUTOLEARN SPOT',
      style: {
        color: '#0f172a',
        fontSize: 30,
        fontWeight: 900,
        fontFamily: 'system-ui',
        letterSpacing: '2px',
        textAlign: 'left',
      },
      zIndex: 10,
    },

    // 3. Brand Subtitle: "LEARN • AUTOMATE • SUCCEED"
    {
      id: 'brandSubtitle',
      type: 'text',
      x: 504,
      y: 92,
      width: 320,
      height: 24,
      rotation: 0,
      visible: true,
      locked: false,
      text: 'LEARN • AUTOMATE • SUCCEED',
      style: {
        color: '#475569',
        fontSize: 11.5,
        fontWeight: 800,
        fontFamily: 'system-ui',
        letterSpacing: '3px',
        textAlign: 'left',
      },
      zIndex: 10,
    },

    // 4. Certificate ID Badge (Top Right)
    {
      id: 'certificateId',
      type: 'certificateId',
      x: 1000,
      y: 45,
      width: 140,
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
    },

    // 5. Certificate Title: "CERTIFICATE OF COMPLETION"
    {
      id: 'title',
      type: 'title',
      x: 150,
      y: 126,
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
    },

    // 6. Presentation Lead: "This certificate is proudly presented to"
    {
      id: 'subtitle',
      type: 'subtitle',
      x: 150,
      y: 216,
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
    },

    // 7. Student Name: "Femi Adeleke"
    {
      id: 'studentName',
      type: 'studentName',
      x: 150,
      y: 256,
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
    },

    // 8. Recognition Lead: "In Recognition of Completing the"
    {
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
    },

    // 9. Course Title: "AI Automation with n8n"
    {
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
    },

    // 10. Date Block (Left)
    {
      id: 'date',
      type: 'date',
      x: 80,
      y: 556,
      width: 240,
      height: 55,
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
        borderBottom: '1.2px solid #cbd5e1',
      },
      zIndex: 10,
    },

    // 11. Authentic 3D Gold Seal Ribbon Medal (Center)
    {
      id: 'seal',
      type: 'image',
      x: 535,
      y: 535,
      width: 130,
      height: 150,
      rotation: 0,
      visible: true,
      locked: false,
      src: '/certificate-gold-seal.png',
      style: { objectFit: 'contain' },
      zIndex: 10,
    },

    // 12. Authentic Founder Signature (Right)
    {
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
    },

    // 13. Founder Name: "A. Femi Adeleke"
    {
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
    },

    // 14. Founder Title: "Founder & Lead Instructor"
    {
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
    },

    // 15. Real Scannable QR Code (Far Right)
    {
      id: 'qrCode',
      type: 'qrCode',
      x: 1040,
      y: 540,
      width: 76,
      height: 76,
      rotation: 0,
      visible: true,
      locked: false,
      binding: 'qrData',
      style: {
        background: '#ffffff',
        borderRadius: 6,
        border: '1.2px solid #cbd5e1',
      },
      zIndex: 10,
    },
  ],
  metadata: {
    createdAt: new Date().toISOString(),
    description: 'Calibrated Luxury Parchment AutoLearn Certificate Layout',
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
  name: 'Femi Adeleke',
  student_name: 'Femi Adeleke',
  date: 'November 18, 2026',
  issue_date: 'November 18, 2026',
  course: 'AI Automation with n8n',
  certificateId: 'CERT-07D13D81',
  certificate_id: 'CERT-07D13D81',
  title: 'CERTIFICATE OF COMPLETION',
  subtitle: 'This certificate is proudly presented to',
  bodyText: 'In Recognition of Completing the',
  founderName: 'A. Femi Adeleke',
  signatureText: 'Founder & Lead Instructor',
  footer: 'AutoLearn Spot • Learn • Automate • Succeed',
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
  // If element has a binding, always use the binding (ignore static text)
  if (element.binding) {
    switch (element.binding) {
      case 'title':
        return settings.title || element.text || 'CERTIFICATE OF COMPLETION'
      case 'subtitle':
        return settings.subtitle || element.text || 'This certificate is proudly presented to'
      case 'bodyText':
        return settings.bodyText || element.text || 'In Recognition of Completing the'
      case 'studentName':
        return data.student_name || data.name || element.text || 'Femi Adeleke'
      case 'course':
        return data.course || element.text || 'AI Automation with n8n'
      case 'date':
        return data.issue_date || data.date || element.text || 'November 18, 2026'
      case 'signatureText':
        return settings.signatureText || element.text || 'Founder & Lead Instructor'
      case 'founderName':
        return settings.founderName || element.text || 'A. Femi Adeleke'
      case 'certificateId':
        return data.certificate_id || data.certificateId || element.text || 'CERT-07D13D81'
      case 'footer':
        return settings.footer || element.text || 'AutoLearn Spot • Learn • Automate • Succeed'
      default:
        return element.text || ''
    }
  }

  // Only use static text if there's NO binding (for custom text elements)
  return element.text || ''
}

/**
 * Get display image source for an element based on its binding
 */
export function getElementSrc(
  element: CertificateElement,
  settings: Record<string, string>,
): string | undefined {
  if (element.id === 'seal' || (element as any).type === 'seal') {
    return (settings as any).sealUrl || element.src || '/certificate-gold-seal.png'
  }
  switch (element.binding) {
    case 'logo':
      return settings.logoUrl || element.src || '/autolearn-brandmark-bold.png'
    case 'signatureUrl':
      return settings.signatureUrl || element.src || '/signature-femi-real.png'
    case 'background':
      return settings.backgroundUrl || element.src || '/certificate-template-parchment-clean.png'
    default:
      return element.src
  }
}

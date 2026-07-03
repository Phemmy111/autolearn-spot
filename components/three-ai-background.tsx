'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function hasWebGLSupport() {
  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
}

const letterPatterns: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
}

function createBlockWord({
  text,
  material,
  edgeMaterial,
  cellGeometry,
  edgeGeometry,
}: {
  text: string
  material: THREE.Material
  edgeMaterial: THREE.Material
  cellGeometry: THREE.BoxGeometry
  edgeGeometry: THREE.EdgesGeometry<THREE.BoxGeometry>
}) {
  const group = new THREE.Group()
  const cell = 0.13
  const gap = 0.038
  const letterGap = 0.13
  const step = cell + gap
  const letterWidth = 5 * step

  let cursor = 0

  text.split('').forEach((letter) => {
    const pattern = letterPatterns[letter]

    if (!pattern) {
      cursor += letterWidth * 0.58
      return
    }

    pattern.forEach((row, rowIndex) => {
      row.split('').forEach((value, columnIndex) => {
        if (value !== '1') {
          return
        }

        const x = cursor + columnIndex * step
        const y = -rowIndex * step
        const z = Math.sin((columnIndex + rowIndex) * 0.65) * 0.035
        const voxel = new THREE.Mesh(cellGeometry, material)
        voxel.position.set(x, y, z)
        group.add(voxel)

        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
        edges.position.copy(voxel.position)
        group.add(edges)
      })
    })

    cursor += letterWidth + letterGap
  })

  const bounds = new THREE.Box3().setFromObject(group)
  const center = bounds.getCenter(new THREE.Vector3())
  group.position.x = -center.x
  group.position.y = -center.y

  return group
}

export function ThreeAiBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current

    if (!mount || !hasWebGLSupport()) {
      return
    }

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 8)

    const root = new THREE.Group()
    root.position.set(0, 0, 0)
    scene.add(root)

    const cyan = new THREE.Color('#00f0ff')
    const soft = new THREE.Color('#dbfcff')
    const darkLine = new THREE.Color('#3b494b')

    const textMaterial = new THREE.MeshBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.23,
      depthWrite: false,
    })
    const textEdgeMaterial = new THREE.LineBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.66,
    })
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: cyan,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    })
    const particleMaterial = new THREE.PointsMaterial({
      color: soft,
      size: 0.028,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    })
    const linkMaterial = new THREE.LineBasicMaterial({
      color: darkLine,
      transparent: true,
      opacity: 0.42,
    })

    const letterGroup = new THREE.Group()
    letterGroup.position.x = -2.05
    root.add(letterGroup)

    const linkGeometries: THREE.BufferGeometry[] = []
    const textCellGeometry = new THREE.BoxGeometry(0.13, 0.13, 0.22)
    const textEdgeGeometry = new THREE.EdgesGeometry(textCellGeometry)
    const autoText = createBlockWord({
      text: 'AUTO',
      material: textMaterial,
      edgeMaterial: textEdgeMaterial,
      cellGeometry: textCellGeometry,
      edgeGeometry: textEdgeGeometry,
    })
    const learnText = createBlockWord({
      text: 'LEARN',
      material: textMaterial,
      edgeMaterial: textEdgeMaterial,
      cellGeometry: textCellGeometry,
      edgeGeometry: textEdgeGeometry,
    })
    autoText.position.set(-0.1, 0.52, 0.08)
    learnText.position.set(-0.1, -0.5, 0.08)
    autoText.rotation.y = -0.05
    learnText.rotation.y = 0.04
    letterGroup.add(autoText, learnText)

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 1), coreMaterial)
    core.position.set(0, 0, -0.72)
    root.add(core)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    })
    const rings = [0, 1, 2].map((index) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.25 + index * 0.58, 0.012, 8, 160), ringMaterial)
      ring.rotation.x = Math.PI / 2 + index * 0.28
      ring.rotation.y = index * 0.42
      ring.position.copy(core.position)
      root.add(ring)
      return ring
    })

    const nodeGeometry = new THREE.SphereGeometry(0.035, 12, 12)
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.74 })
    const neuralNodes = [
      [-2.95, 1.58, -0.2],
      [-3.22, -0.58, 0.45],
      [-0.18, 2.04, 0.38],
      [2.92, 1.18, -0.12],
      [3.04, -1.42, 0.34],
      [-0.86, -2.16, -0.34],
    ].map(([x, y, z]) => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
      node.position.set(x, y, z)
      root.add(node)
      return node
    })

    neuralNodes.forEach((node, index) => {
      const target = index % 2 === 0 ? core.position : neuralNodes[(index + 1) % neuralNodes.length].position
      const linkGeometry = new THREE.BufferGeometry().setFromPoints([node.position, target])
      linkGeometries.push(linkGeometry)
      const line = new THREE.Line(
        linkGeometry,
        linkMaterial,
      )
      root.add(line)
    })

    const particlePositions = new Float32Array(120 * 3)

    for (let i = 0; i < 120; i++) {
      const stride = i * 3
      particlePositions[stride] = (Math.random() - 0.5) * 6.4
      particlePositions[stride + 1] = (Math.random() - 0.5) * 4
      particlePositions[stride + 2] = (Math.random() - 0.5) * 2.8
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    root.add(particles)

    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()

      const isSmall = width < 720
      root.position.set(isSmall ? -0.12 : -0.48, isSmall ? -0.55 : -0.25, 0)
      root.scale.setScalar(isSmall ? 0.78 : 1.08)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    let frameId = 0
    const startedAt = performance.now()

    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000

      root.rotation.y = Math.sin(elapsed * 0.18) * 0.06
      root.rotation.x = Math.cos(elapsed * 0.16) * 0.04
      letterGroup.rotation.y = Math.sin(elapsed * 0.32) * 0.035
      autoText.rotation.y = -0.05 + Math.sin(elapsed * 0.7) * 0.055
      autoText.rotation.x = Math.cos(elapsed * 0.48) * 0.025
      autoText.position.z = 0.08 + Math.sin(elapsed * 0.9) * 0.12
      learnText.rotation.y = 0.04 + Math.cos(elapsed * 0.64) * 0.055
      learnText.rotation.x = Math.sin(elapsed * 0.52) * 0.025
      learnText.position.z = 0.08 + Math.cos(elapsed * 0.82) * 0.12
      core.rotation.x = elapsed * 0.18
      core.rotation.y = elapsed * 0.24
      particles.rotation.z = elapsed * 0.018

      rings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.14 + index * 0.055)
      })

      neuralNodes.forEach((node, index) => {
        const pulse = 1 + Math.sin(elapsed * 1.4 + index) * 0.22
        node.scale.setScalar(pulse)
      })

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.dispose()
      textMaterial.dispose()
      textEdgeMaterial.dispose()
      coreMaterial.dispose()
      particleMaterial.dispose()
      linkMaterial.dispose()
      ringMaterial.dispose()
      textCellGeometry.dispose()
      textEdgeGeometry.dispose()
      linkGeometries.forEach((geometry) => geometry.dispose())
      core.geometry.dispose()
      rings.forEach((ring) => ring.geometry.dispose())
      nodeGeometry.dispose()
      nodeMaterial.dispose()
      particleGeometry.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="three-ai-background" aria-hidden="true" />
}

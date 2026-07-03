'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const nodePositions: [number, number, number][] = [
  [-2.4, -0.35, 0.2],
  [-1.15, 0.85, -0.55],
  [0.2, 0.1, 0.35],
  [1.35, 0.85, -0.25],
  [2.2, -0.55, 0.45],
  [0.9, -1.05, -0.45],
]

const links: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [2, 5],
  [3, 4],
  [5, 4],
]

export function ThreeAutomationField() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current

    if (!mount) {
      return
    }

    const supportCanvas = document.createElement('canvas')
    const supportsWebGL = Boolean(supportCanvas.getContext('webgl2') ?? supportCanvas.getContext('webgl'))

    if (!supportsWebGL) {
      return
    }

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    } catch {
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 6.2)

    const group = new THREE.Group()
    scene.add(group)

    const cyan = new THREE.Color('#00f0ff')
    const muted = new THREE.Color('#3b494b')
    const glow = new THREE.Color('#dbfcff')

    const particlePositions = new Float32Array(72 * 3)

    for (let i = 0; i < 72; i++) {
      const stride = i * 3
      particlePositions[stride] = (Math.random() - 0.5) * 6
      particlePositions[stride + 1] = (Math.random() - 0.5) * 3.6
      particlePositions[stride + 2] = (Math.random() - 0.5) * 2.6
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: glow,
      size: 0.035,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    group.add(particles)

    const nodeGeometry = new THREE.SphereGeometry(0.075, 24, 24)
    const activeNodeGeometry = new THREE.SphereGeometry(0.11, 32, 32)
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: cyan })
    const activeNodeMaterial = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.9 })

    nodePositions.forEach((position, index) => {
      const mesh = new THREE.Mesh(index === 2 ? activeNodeGeometry : nodeGeometry, index === 2 ? activeNodeMaterial : nodeMaterial)
      mesh.position.set(...position)
      group.add(mesh)
    })

    links.forEach(([from, to], index) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...nodePositions[from]),
        new THREE.Vector3(...nodePositions[to]),
      ])
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: index % 2 === 0 ? cyan : muted,
          transparent: true,
          opacity: index % 2 === 0 ? 0.68 : 0.5,
        }),
      )
      group.add(line)
    })

    const packetGeometry = new THREE.SphereGeometry(0.045, 16, 16)
    const packetMaterial = new THREE.MeshBasicMaterial({ color: cyan })
    const packets = links.map(([from, to], index) => {
      const mesh = new THREE.Mesh(packetGeometry, packetMaterial)
      mesh.userData = { from, to, offset: index * 0.17 }
      group.add(mesh)
      return mesh
    })

    const ringGeometry = new THREE.TorusGeometry(0.34, 0.007, 8, 72)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.42 })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.set(...nodePositions[2])
    group.add(ring)

    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    let frameId = 0
    const startedAt = performance.now()

    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000

      group.rotation.y = Math.sin(elapsed * 0.28) * 0.18
      group.rotation.x = Math.cos(elapsed * 0.22) * 0.08
      particles.rotation.z = elapsed * 0.035
      ring.rotation.z = elapsed * 0.75
      ring.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.08)

      packets.forEach((packet) => {
        const { from, to, offset } = packet.userData as { from: number; to: number; offset: number }
        const start = new THREE.Vector3(...nodePositions[from])
        const end = new THREE.Vector3(...nodePositions[to])
        const progress = (elapsed * 0.24 + offset) % 1
        packet.position.lerpVectors(start, end, progress)
        packet.scale.setScalar(0.75 + Math.sin((progress + offset) * Math.PI) * 0.55)
      })

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.dispose()
      nodeGeometry.dispose()
      activeNodeGeometry.dispose()
      nodeMaterial.dispose()
      activeNodeMaterial.dispose()
      packetGeometry.dispose()
      packetMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="three-automation-field pointer-events-none absolute inset-0" aria-hidden="true" />
}

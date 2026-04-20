import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface WelcomeScreenProps {
  onComplete: () => void
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'loading' | 'text' | 'exit'>('loading')
  const [textVisible, setTextVisible] = useState(false)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    icosahedron: THREE.LineSegments
    rings: THREE.Group
    animationId: number
  } | null>(null)

  // Three.js 3D scene setup
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    // Icosahedron wireframe (AI Brain)
    const geometry = new THREE.IcosahedronGeometry(1.5, 1)
    const wireframeGeo = new THREE.WireframeGeometry(geometry)
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    })
    const icosahedron = new THREE.LineSegments(wireframeGeo, wireframeMat)
    icosahedron.scale.set(0, 0, 0)
    scene.add(icosahedron)

    // Orbital rings
    const rings = new THREE.Group()

    const ring1Geo = new THREE.TorusGeometry(2.2, 0.008, 16, 100)
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    })
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat)
    ring1.rotation.x = Math.PI / 3
    rings.add(ring1)

    const ring2Geo = new THREE.TorusGeometry(2.8, 0.006, 16, 100)
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
    })
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat)
    ring2.rotation.x = Math.PI / 5
    ring2.rotation.y = Math.PI / 4
    rings.add(ring2)

    const ring3Geo = new THREE.TorusGeometry(3.4, 0.004, 16, 100)
    const ring3Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    })
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat)
    ring3.rotation.y = Math.PI / 6
    ring3.rotation.z = Math.PI / 3
    rings.add(ring3)

    rings.visible = false
    scene.add(rings)

    // Ambient particles
    const particlesGeo = new THREE.BufferGeometry()
    const particleCount = 200
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 15
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
    })
    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)

    sceneRef.current = { renderer, scene, camera, icosahedron, rings, animationId: 0 }

    // Animation state
    let startTime = Date.now()
    let icosahedronScale = 0
    let targetScale = 1
    let ringsVisible = false

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000

      // Scale in icosahedron with elastic easing
      if (elapsed < 1.5) {
        const t = elapsed / 1.5
        const elastic = t === 0
          ? 0
          : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
        icosahedronScale = elastic
        icosahedron.scale.set(icosahedronScale, icosahedronScale, icosahedronScale)
      } else {
        icosahedron.scale.set(targetScale, targetScale, targetScale)
      }

      // Show rings after 0.5s
      if (elapsed > 0.5 && !ringsVisible) {
        rings.visible = true
        ringsVisible = true
      }

      // Rotate elements
      icosahedron.rotation.y += 0.003
      icosahedron.rotation.x += 0.001

      if (ringsVisible) {
        ring1.rotation.y += 0.005
        ring2.rotation.x += 0.004
        ring3.rotation.z += 0.003
      }

      particles.rotation.y += 0.0005

      renderer.render(scene, camera)
      sceneRef.current!.animationId = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      renderer.dispose()
    }
  }, [])

  // Phase transitions
  useEffect(() => {
    const t1 = setTimeout(() => {
      setTextVisible(true)
      setPhase('text')
    }, 800)

    const t2 = setTimeout(() => {
      setPhase('exit')
      setTimeout(() => {
        onComplete()
      }, 800)
    }, 5000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onComplete])

  const letters = 'WELCOME TO MY APP'.split('')

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ${
        phase === 'exit' ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'
      }`}
      style={{ background: '#050505' }}
    >
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        style={{ mixBlendMode: 'screen' }}
      >
        <source src="https://files.catbox.moe/1djfqy.mp4" type="video/mp4" />
      </video>

      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* Dark overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: 'radial-gradient(ellipse at center, transparent 0%, #050505 70%)',
        }}
      />

      {/* Text Assembly */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ zIndex: 3 }}
      >
        <div className="flex flex-wrap justify-center gap-[2px] sm:gap-1">
          {letters.map((letter, i) => (
            <span
              key={i}
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-[-0.02em] text-white"
              style={{
                opacity: textVisible ? 1 : 0,
                transform: textVisible
                  ? 'translateZ(0)'
                  : `translateZ(${Math.random() * 1000 - 500}px)`,
                transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s`,
                textShadow: '0 0 60px rgba(255,255,255,0.2)',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>

        {/* Subtle tagline */}
        <p
          className="mt-6 text-sm sm:text-base tracking-[0.3em] uppercase"
          style={{
            opacity: textVisible ? 0.4 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.8s ease 1.5s',
            color: '#8A8A8A',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Powered by Claude 4.7 Opus
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          zIndex: 4,
          background: 'linear-gradient(to top, #050505, transparent)',
        }}
      />
    </div>
  )
}

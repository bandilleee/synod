"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function AuroraBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const mount = mountRef.current

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 3))
    renderer.setSize(window.innerWidth, window.innerHeight)
    mount.appendChild(renderer.domElement)

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform float iTime;
      uniform vec2 iResolution;
      varying vec2 vUv;

      #define S smoothstep

      mat2 rot(float a) {
        float c = cos(a);
        float s = sin(a);
        return mat2(c, -s, s, c);
      }

      float ringBand(float r, float radius, float width) {
        return S(width, 0.0, abs(r - radius));
      }

      vec3 nightPalette(float t) {
        vec3 deep = vec3(0.01, 0.03, 0.06);
        vec3 teal = vec3(0.00, 0.55, 0.50);
        vec3 violet = vec3(0.36, 0.16, 0.56);
        vec3 mist = vec3(0.08, 0.20, 0.30);

        vec3 col = mix(deep, teal, S(0.0, 0.55, t));
        col = mix(col, violet, S(0.42, 0.95, t));
        col = mix(col, mist, S(0.65, 1.0, t) * 0.35);
        return col;
      }

      void main() {
        vec2 uv = (vUv - 0.5) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = iTime * 0.22;

        vec2 p = uv;
        p *= rot(-0.24);
        p.y += 0.2;

        vec4 O = vec4(0.);

        for (float i = 0.; i < 6.; i += 1.) {
          float n = i / 5.0;

          vec2 c = vec2(
            -0.42 + n * 0.18 + sin(t * (0.8 + n * 0.3) + i * 1.3) * 0.03,
            -0.18 + n * 0.10 + cos(t * 0.7 + i * 1.1) * 0.02
          );

          vec2 q = p - c;
          q *= rot(0.45 + n * 0.22 + sin(t + i) * 0.05);

          float r = length(q);
          float ang = atan(q.y, q.x);
          float arcMask = S(0.95, -0.55, cos(ang - t * (0.55 + n * 0.2) - i * 0.7));

          float wavRadius = 0.35 + n * 0.1 + sin(ang * 2.0 + t * 1.1 + i * 0.8) * 0.02;
          float band = ringBand(r, wavRadius, 0.009 + n * 0.002);
          float halo = ringBand(r, wavRadius, 0.05 + n * 0.01) * 0.22;

          vec3 col = nightPalette(fract(n + sin(t * 0.5 + i) * 0.2 + 0.3));
          O.rgb += col * (band * 1.3 + halo) * arcMask;
        }

        float sweep = sin((uv.x * 2.8 - uv.y * 5.0) + t * 1.8) * 0.5 + 0.5;
        float mist = S(1.0, 0.1, abs(uv.y + 0.25));
        O.rgb += vec3(0.02, 0.05, 0.08) * sweep * mist * 0.35;

        float vignette = S(1.25, 0.25, length(uv));
        O.rgb *= mix(0.35, 1.0, vignette);
        O.rgb = pow(O.rgb, vec3(0.9));

        gl_FragColor = O;
      }
    `

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new THREE.Vector2(
            window.innerWidth * 2,
            window.innerHeight * 2
          ),
        },
      },
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const plane = new THREE.Mesh(geometry, material)
    scene.add(plane)

    const startTime = Date.now()
    const SPEED = 0.80
    let animFrameId: number

    const animate = () => {
      animFrameId = requestAnimationFrame(animate)
      material.uniforms.iTime.value = (Date.now() - startTime) * 0.001 * SPEED
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      material.uniforms.iResolution.value.set(
        window.innerWidth * 2,
        window.innerHeight * 2
      )
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0"
      style={{ background: "black" }}
    />
  )
}
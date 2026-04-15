"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Palette matches hero: terracotta, amber, cream
const COLORS = ["#C4622D", "#F0A500", "#FDFBF7", "#C4622D", "#A8A29E"];
const OPACITIES = [0.55, 0.42, 0.18, 0.38, 0.2];
const PARTICLE_COUNT = 28;
const CONNECTION_DIST = 2.8;

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 7);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Particles ──────────────────────────────────────────────────────────
    // Skill: Procedural Oscillation — each particle has unique phase + speed
    const sharedGeo = new THREE.SphereGeometry(0.055, 6, 6);

    type Particle = {
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number; // unique offset for sin/cos
      speed: number; // oscillation speed
    };

    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ci = i % COLORS.length;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLORS[ci]),
        transparent: true,
        opacity: OPACITIES[ci] as number,
      });
      const mesh = new THREE.Mesh(sharedGeo, mat);

      // Spread across wide frustum area
      const bx = (Math.random() - 0.5) * 12;
      const by = (Math.random() - 0.5) * 6;
      const bz = (Math.random() - 0.5) * 3;
      mesh.position.set(bx, by, bz);

      scene.add(mesh);
      particles.push({
        mesh,
        baseX: bx,
        baseY: by,
        baseZ: bz,
        phase: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5,
        speed: 0.18 + Math.random() * 0.14,
      });
    }

    // ── Connections ────────────────────────────────────────────────────────
    // Connect nearby particle pairs with faint lines
    const pairs: [number, number][] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const pi = particles[i];
        const pj = particles[j];
        if (!pi || !pj) continue;
        const dx = pi.baseX - pj.baseX;
        const dy = pi.baseY - pj.baseY;
        const dz = pi.baseZ - pj.baseZ;
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < CONNECTION_DIST) {
          pairs.push([i, j]);
        }
      }
    }

    let lines: THREE.LineSegments | null = null;
    let lineGeo: THREE.BufferGeometry | null = null;
    let linePosArr: Float32Array | null = null;

    if (pairs.length > 0) {
      linePosArr = new Float32Array(pairs.length * 6);
      lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(linePosArr, 3),
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color("#FDFBF7"),
        transparent: true,
        opacity: 0.055,
      });
      lines = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lines);
    }

    // ── Animation loop ─────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Skill: Oscillation — unique phase + speed per particle
      for (const p of particles) {
        p.mesh.position.y =
          p.baseY + Math.sin(elapsed * p.speed + p.phase) * 0.2;
        p.mesh.position.x =
          p.baseX + Math.cos(elapsed * p.speed * 0.55 + p.phase) * 0.1;
      }

      // Update line endpoints to follow particle positions
      if (linePosArr && lineGeo && pairs.length > 0) {
        for (let k = 0; k < pairs.length; k++) {
          const pair = pairs[k];
          if (!pair) continue;
          const [ai, bi] = pair;
          const pa = particles[ai]?.mesh.position;
          const pb = particles[bi]?.mesh.position;
          if (!pa || !pb) continue;
          const off = k * 6;
          linePosArr[off + 0] = pa.x;
          linePosArr[off + 1] = pa.y;
          linePosArr[off + 2] = pa.z;
          linePosArr[off + 3] = pb.x;
          linePosArr[off + 4] = pb.y;
          linePosArr[off + 5] = pb.z;
        }
        (lineGeo.attributes.position as THREE.BufferAttribute).needsUpdate =
          true;
      }

      // Skill: slow circular camera orbit for depth
      const cd = 7;
      camera.position.x = Math.cos(elapsed * 0.04) * cd * 0.35;
      camera.position.z = Math.sin(elapsed * 0.04) * cd * 0.18 + 6.6;
      camera.position.y = Math.sin(elapsed * 0.017) * 0.28;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    function onResize() {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      if (nw === 0 || nh === 0) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener("resize", onResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sharedGeo.dispose();
      lineGeo?.dispose();
      for (const p of particles) {
        (p.mesh.material as THREE.MeshBasicMaterial).dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: 0,
        maskImage:
          "radial-gradient(ellipse 85% 80% at 50% 50%, black 35%, transparent 78%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 85% 80% at 50% 50%, black 35%, transparent 78%)",
      }}
    />
  );
}

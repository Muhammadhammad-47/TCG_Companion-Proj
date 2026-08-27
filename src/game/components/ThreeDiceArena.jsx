import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Generate dynamic high-res textures with authentic dice pips
function createDiceFaceTexture(value, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const isRed = theme === 'red';

  // Base background gradient with rounded corners feel
  const bgGrad = ctx.createRadialGradient(128, 128, 20, 128, 128, 160);
  if (isRed) {
    bgGrad.addColorStop(0, '#ff2a55');
    bgGrad.addColorStop(0.7, '#c00028');
    bgGrad.addColorStop(1, '#660015');
  } else {
    bgGrad.addColorStop(0, '#ffe066');
    bgGrad.addColorStop(0.7, '#d4a017');
    bgGrad.addColorStop(1, '#805900');
  }

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Outer beveled border
  ctx.strokeStyle = isRed ? 'rgba(255, 120, 150, 0.6)' : 'rgba(255, 245, 180, 0.7)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 242);

  // Inner subtle border
  ctx.strokeStyle = isRed ? 'rgba(0, 0, 0, 0.3)' : 'rgba(100, 70, 0, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 220, 220);

  // Pip drawing helper
  const drawPip = (x, y) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);

    const pipGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 22);
    if (isRed) {
      pipGrad.addColorStop(0, '#ffffff');
      pipGrad.addColorStop(0.8, '#f0f0f0');
      pipGrad.addColorStop(1, '#d0d0d0');
    } else {
      pipGrad.addColorStop(0, '#332005');
      pipGrad.addColorStop(0.8, '#1a1000');
      pipGrad.addColorStop(1, '#050300');
    }

    ctx.fillStyle = pipGrad;
    ctx.shadowColor = isRed ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.restore();
  };

  const c = 128;
  const l = 68;
  const r = 188;
  const t = 68;
  const b = 188;

  switch (value) {
    case 1:
      drawPip(c, c);
      break;
    case 2:
      drawPip(l, t);
      drawPip(r, b);
      break;
    case 3:
      drawPip(l, t);
      drawPip(c, c);
      drawPip(r, b);
      break;
    case 4:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 5:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(c, c);
      drawPip(l, b);
      drawPip(r, b);
      break;
    case 6:
      drawPip(l, t);
      drawPip(r, t);
      drawPip(l, c);
      drawPip(r, c);
      drawPip(l, b);
      drawPip(r, b);
      break;
    default:
      drawPip(c, c);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Three.js Box Face ordering: [Right(+x), Left(-x), Top(+y), Bottom(-y), Front(+z), Back(-z)]
// Standard 6-face mapping: Right=2, Left=5, Top=3, Bottom=4, Front=1, Back=6
function createDiceMaterials(theme) {
  return [
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(2, theme), roughness: 0.25, metalness: 0.35 }), // Right (2)
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(5, theme), roughness: 0.25, metalness: 0.35 }), // Left (5)
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(3, theme), roughness: 0.25, metalness: 0.35 }), // Top (3)
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(4, theme), roughness: 0.25, metalness: 0.35 }), // Bottom (4)
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(1, theme), roughness: 0.25, metalness: 0.35 }), // Front (1)
    new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(6, theme), roughness: 0.25, metalness: 0.35 })  // Back (6)
  ];
}

// Target rotations (Euler) to face the camera (+Z) with target number
const FACE_EULER_ROTATIONS = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: 0, y: -Math.PI / 2, z: 0 },
  3: { x: -Math.PI / 2, y: 0, z: 0 },
  4: { x: Math.PI / 2, y: 0, z: 0 },
  5: { x: 0, y: Math.PI / 2, z: 0 },
  6: { x: 0, y: Math.PI, z: 0 }
};

export default function ThreeDiceArena({
  attackerValues = [3, 4],
  defenderValues = [3, 3],
  isRolling = false,
  isMultiplier = false,
  onRollComplete
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const diceMeshesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 900;
    const height = 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 9.5);
    camera.lookAt(0, -0.2, 0);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const redGlowLight = new THREE.PointLight(0xff0055, 4.5, 14);
    redGlowLight.position.set(-4.5, 3.5, 2.5);
    scene.add(redGlowLight);

    const goldGlowLight = new THREE.PointLight(0xffd700, 4.5, 14);
    goldGlowLight.position.set(4.5, 3.5, 2.5);
    scene.add(goldGlowLight);

    // 4. Velvet Arena Floor
    const floorGeo = new THREE.PlaneGeometry(24, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x040b18,
      roughness: 0.75,
      metalness: 0.25
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.3;
    floor.receiveShadow = true;
    scene.add(floor);

    // Center divider neon ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.28, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, -1.28, 0);
    scene.add(ring);

    // 5. Build Dice Meshes (Enlarged for Full Screen)
    const diceSize = 1.6;
    const diceGeo = new THREE.BoxGeometry(diceSize, diceSize, diceSize);

    const redMaterials = createDiceMaterials('red');
    const goldMaterials = createDiceMaterials('gold');

    const diceData = [];

    // Red Die 1 (Attacker Left)
    const redDie1 = new THREE.Mesh(diceGeo, redMaterials);
    redDie1.castShadow = true;
    redDie1.position.set(isMultiplier ? -2.8 : -3.8, -0.4, 0.2);
    scene.add(redDie1);
    diceData.push({ mesh: redDie1, type: 'red', idx: 0, targetVal: attackerValues[0] || 1, restPos: new THREE.Vector3(isMultiplier ? -2.8 : -3.8, -0.4, 0.2) });

    // Red Die 2 (Attacker Right) - if not multiplier
    if (!isMultiplier) {
      const redDie2 = new THREE.Mesh(diceGeo, redMaterials);
      redDie2.castShadow = true;
      redDie2.position.set(-1.6, -0.4, -0.2);
      scene.add(redDie2);
      diceData.push({ mesh: redDie2, type: 'red', idx: 1, targetVal: attackerValues[1] || 1, restPos: new THREE.Vector3(-1.6, -0.4, -0.2) });
    }

    // Gold Die 1 (Defender Left)
    const goldDie1 = new THREE.Mesh(diceGeo, goldMaterials);
    goldDie1.castShadow = true;
    goldDie1.position.set(1.6, -0.4, -0.2);
    scene.add(goldDie1);
    diceData.push({ mesh: goldDie1, type: 'gold', idx: 0, targetVal: defenderValues[0] || 1, restPos: new THREE.Vector3(1.6, -0.4, -0.2) });

    // Gold Die 2 (Defender Right)
    const goldDie2 = new THREE.Mesh(diceGeo, goldMaterials);
    goldDie2.castShadow = true;
    goldDie2.position.set(3.8, -0.4, 0.2);
    scene.add(goldDie2);
    diceData.push({ mesh: goldDie2, type: 'gold', idx: 1, targetVal: defenderValues[1] || 1, restPos: new THREE.Vector3(3.8, -0.4, 0.2) });

    diceMeshesRef.current = diceData;

    // Static alignment
    diceData.forEach(d => {
      d.mesh.position.copy(d.restPos);
      const rot = FACE_EULER_ROTATIONS[d.targetVal] || FACE_EULER_ROTATIONS[1];
      d.mesh.rotation.set(rot.x, rot.y, rot.z);
    });

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [isMultiplier]);

  // Physical Throw Physics Animation Trigger
  useEffect(() => {
    if (!isRolling) {
      // Settle on target values
      diceMeshesRef.current.forEach(d => {
        const targetVal = d.type === 'red' ? (attackerValues[d.idx] || 1) : (defenderValues[d.idx] || 1);
        d.targetVal = targetVal;
        const rot = FACE_EULER_ROTATIONS[targetVal] || FACE_EULER_ROTATIONS[1];
        d.mesh.rotation.set(rot.x, rot.y, rot.z);
        d.mesh.position.copy(d.restPos);
      });
      return;
    }

    startTimeRef.current = performance.now();
    const duration = 1200; // ms for natural realistic throw

    // Generate physical launch configurations for each die
    const tossConfigs = diceMeshesRef.current.map((d, i) => {
      const targetVal = d.type === 'red' ? (attackerValues[d.idx] || 1) : (defenderValues[d.idx] || 1);
      d.targetVal = targetVal;
      const finalRot = FACE_EULER_ROTATIONS[targetVal] || FACE_EULER_ROTATIONS[1];

      // Realistic multi-axis spin revolutions (4 to 5 full turns)
      const extraSpinsX = (4 + (i % 2)) * Math.PI * 2;
      const extraSpinsY = (3 + Math.floor(Math.random() * 2)) * Math.PI * 2;
      const extraSpinsZ = (2 + Math.floor(Math.random() * 2)) * Math.PI * 2;

      // Start position: High toss from upper back corner towards table
      const launchXOffset = (Math.random() - 0.5) * 1.5;
      const startPos = new THREE.Vector3(
        d.restPos.x + launchXOffset,
        5.5 + Math.random() * 0.8,
        -3.5
      );

      return {
        startPos,
        endPos: d.restPos.clone(),
        startRot: new THREE.Vector3(
          finalRot.x + extraSpinsX,
          finalRot.y + extraSpinsY,
          finalRot.z + extraSpinsZ
        ),
        endRot: new THREE.Vector3(finalRot.x, finalRot.y, finalRot.z)
      };
    });

    const updatePhysics = (now) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);

      // Smooth horizontal trajectory progress (Cubic Ease Out)
      const easeX = 1 - Math.pow(1 - t, 2.5);
      const easeZ = 1 - Math.pow(1 - t, 2.5);

      // Realistic multi-bounce vertical height curve
      let height = 0;
      if (t < 0.45) {
        // Initial fall from throw arc
        const p = t / 0.45;
        height = Math.sin(p * Math.PI * 0.5 + Math.PI * 0.5); // Starts high, accelerates down to table
      } else if (t < 0.75) {
        // First big bounce
        const p = (t - 0.45) / 0.3;
        height = Math.sin(p * Math.PI) * 0.38;
      } else if (t < 0.92) {
        // Second smaller bounce
        const p = (t - 0.75) / 0.17;
        height = Math.sin(p * Math.PI) * 0.14;
      } else {
        // Micro settle roll
        const p = (t - 0.92) / 0.08;
        height = Math.sin(p * Math.PI) * 0.03;
      }

      // Smooth rotational deceleration with exponential friction decay
      const rotProgress = 1 - Math.pow(1 - t, 3.2);

      diceMeshesRef.current.forEach((d, idx) => {
        const config = tossConfigs[idx];
        if (!config) return;

        // Position update
        const curX = THREE.MathUtils.lerp(config.startPos.x, config.endPos.x, easeX);
        const curZ = THREE.MathUtils.lerp(config.startPos.z, config.endPos.z, easeZ);
        const curY = config.endPos.y + (t < 0.45 ? (config.startPos.y - config.endPos.y) * height : height * 3.2);

        d.mesh.position.set(curX, curY, curZ);

        // Rotation update
        const curRotX = THREE.MathUtils.lerp(config.startRot.x, config.endRot.x, rotProgress);
        const curRotY = THREE.MathUtils.lerp(config.startRot.y, config.endRot.y, rotProgress);
        const curRotZ = THREE.MathUtils.lerp(config.startRot.z, config.endRot.z, rotProgress);

        d.mesh.rotation.set(curRotX, curRotY, curRotZ);
      });

      if (t < 1) {
        requestAnimationFrame(updatePhysics);
      } else {
        // Final rest alignment
        diceMeshesRef.current.forEach((d, idx) => {
          const config = tossConfigs[idx];
          if (config) {
            d.mesh.position.copy(config.endPos);
            d.mesh.rotation.set(config.endRot.x, config.endRot.y, config.endRot.z);
          }
        });
        if (onRollComplete) onRollComplete();
      }
    };

    requestAnimationFrame(updatePhysics);
  }, [isRolling, attackerValues, defenderValues]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '360px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'radial-gradient(ellipse at center, rgba(12, 30, 68, 0.98) 0%, rgba(2, 6, 18, 0.99) 100%)',
        border: '1.5px solid rgba(0, 240, 255, 0.4)',
        boxShadow: 'inset 0 0 45px rgba(0,0,0,0.9), 0 0 30px rgba(0, 240, 255, 0.3)',
        margin: '12px 0'
      }}
    />
  );
}

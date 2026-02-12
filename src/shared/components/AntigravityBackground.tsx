import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type AntigravityFieldProps = {
    count?: number;
    ringRadius?: number;
    magnetRadius?: number;
    waveSpeed?: number;
    waveAmplitude?: number;
    particleSize?: number;
    lerpSpeed?: number;
    color?: string;
    autoAnimate?: boolean;
    particleVariance?: number;
    rotationSpeed?: number;
    depthFactor?: number;
    pulseSpeed?: number;
    fieldStrength?: number;
};

const AntigravityField = ({
    count = 320,
    ringRadius = 8,
    magnetRadius = 6,
    waveSpeed = 0.6,
    waveAmplitude = 0.6,
    particleSize = 0.08,
    lerpSpeed = 0.08,
    color = "var(--sf-300)",
    autoAnimate = true,
    particleVariance = 1.4,
    rotationSpeed = 0.12,
    depthFactor = 1.6,
    pulseSpeed = 2.6,
    fieldStrength = 2.2,
}: AntigravityFieldProps) => {
    const pointsRef = useRef<THREE.Points>(null);
    const pointer = useRef(new THREE.Vector2(0, 0));
    const { size, viewport } = useThree();

    const { basePositions, positions, offsets } = useMemo(() => {
        const base = new Float32Array(count * 3);
        const current = new Float32Array(count * 3);
        const seeds = new Float32Array(count);

        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const radius = ringRadius + (Math.random() - 0.5) * particleVariance;
            const depth = (Math.random() - 0.5) * depthFactor;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = depth;
            const idx = i * 3;
            base[idx] = x;
            base[idx + 1] = y;
            base[idx + 2] = z;
            current[idx] = x;
            current[idx + 1] = y;
            current[idx + 2] = z;
            seeds[i] = Math.random() * Math.PI * 2;
        }

        return { basePositions: base, positions: current, offsets: seeds };
    }, [count, ringRadius, particleVariance, depthFactor]);

    const geometry = useMemo(() => {
        const buffer = new THREE.BufferGeometry();
        buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return buffer;
    }, [positions]);

    const [resolvedColor, setResolvedColor] = useState(color);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!color.startsWith("var(")) {
            setResolvedColor(color);
            return;
        }
        const variableName = color.replace(/^var\((.*)\)$/, "$1").trim();
        const cssValue = getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
            .trim();
        setResolvedColor(cssValue || color);
    }, [color]);

    useEffect(() => {
        const handlePointer = (event: PointerEvent) => {
            const x = (event.clientX / size.width) * 2 - 1;
            const y = -(event.clientY / size.height) * 2 + 1;
            pointer.current.set(x, y);
        };

        window.addEventListener("pointermove", handlePointer);
        return () => window.removeEventListener("pointermove", handlePointer);
    }, [size]);

    useFrame(({ clock }) => {
        if (!pointsRef.current) return;

        const time = clock.getElapsedTime();
        const attribute = pointsRef.current.geometry.getAttribute(
            "position"
        ) as THREE.BufferAttribute;
        const array = attribute.array as Float32Array;
        const pointerX = pointer.current.x * (viewport.width / 2);
        const pointerY = pointer.current.y * (viewport.height / 2);

        for (let i = 0; i < count; i += 1) {
            const idx = i * 3;
            const seed = offsets[i];
            const wave = Math.sin(time * waveSpeed + seed) * waveAmplitude;
            const wobble = Math.cos(time * waveSpeed * 0.8 + seed) * waveAmplitude;

            let x = basePositions[idx] + wave;
            let y = basePositions[idx + 1] + wobble;
            let z =
                basePositions[idx + 2] +
                Math.sin(time * waveSpeed + seed * 1.7) * (depthFactor * 0.15);

            const dx = x - pointerX;
            const dy = y - pointerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < magnetRadius) {
                const strength = (1 - dist / magnetRadius) * fieldStrength;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                x += nx * strength;
                y += ny * strength;
            }

            array[idx] = THREE.MathUtils.lerp(array[idx], x, lerpSpeed);
            array[idx + 1] = THREE.MathUtils.lerp(array[idx + 1], y, lerpSpeed);
            array[idx + 2] = THREE.MathUtils.lerp(array[idx + 2], z, lerpSpeed);
        }

        if (autoAnimate) {
            pointsRef.current.rotation.z = time * rotationSpeed;
            pointsRef.current.rotation.x = time * rotationSpeed * 0.4;
        }

        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.size = particleSize * (1 + Math.sin(time * pulseSpeed) * 0.15);
        attribute.needsUpdate = true;
    });

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                size={particleSize}
                color={resolvedColor}
                sizeAttenuation
                transparent
                opacity={0.75}
                depthWrite={false}
            />
        </points>
    );
};

const AntigravityBackground = ({ className }: { className?: string }) => {
    return (
        <div className={className}>
            <Canvas
                dpr={[1, 1.6]}
                camera={{ position: [0, 0, 18], fov: 45 }}
                style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            >
                <ambientLight intensity={0.6} />
                <AntigravityField />
            </Canvas>
        </div>
    );
};

export default AntigravityBackground;

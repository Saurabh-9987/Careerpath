import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { careerData, careerPaths } from "./data/careerData";
import {
  getScore,
  getMatchedSkills,
  getMissingSkills,
} from "./utils/careerScoring";
import { useCareer } from "./context/CareerContextCore";

/**
 * Curated 3D constellation layout and visual metadata for all 20 careers.
 * Grouped into spatial domain clusters with distinct HSL-tailored color accents.
 */
const CAREER_METADATA = {
  // --- Data & Core Analytics Cluster ---
  "Data Analyst": {
    position: [-3.0, 0.3, 0.4],
    color: "#10B981", // Emerald
    category: "Data & Analytics",
    icon: "📊",
    labelOffset: [0, 0.78, 0],
  },
  "Data Scientist": {
    position: [-4.4, 2.3, -0.3],
    color: "#3B82F6", // Royal Blue
    category: "Data & AI",
    icon: "🔬",
    labelOffset: [0, 0.78, 0],
  },
  "Data Engineer": {
    position: [-2.2, 2.5, -0.6],
    color: "#059669", // Mint / Deep Emerald
    category: "Data Infrastructure",
    icon: "⚙️",
    labelOffset: [0, 0.78, 0],
  },
  "Business Intelligence Analyst": {
    position: [-1.4, 0.4, 0.6],
    color: "#14B8A6", // Teal
    category: "Data & Analytics",
    icon: "📈",
    labelOffset: [0.35, 0.76, 0],
  },

  // --- Machine Learning & AI Cluster ---
  "ML Engineer": {
    position: [-5.5, 1.1, -0.4],
    color: "#6366F1", // Indigo
    category: "Machine Learning",
    icon: "🧠",
    labelOffset: [0, 0.78, 0],
  },
  "AI Engineer": {
    position: [-6.4, -0.7, 0.2],
    color: "#0EA5E9", // Sky Blue
    category: "Artificial Intelligence",
    icon: "🤖",
    labelOffset: [0, 0.78, 0],
  },
  "NLP Engineer": {
    position: [-4.6, -2.1, -0.6],
    color: "#2563EB", // Cobalt Blue
    category: "Language & AI",
    icon: "🗣️",
    labelOffset: [0, -0.78, 0],
  },
  "Computer Vision Engineer": {
    position: [-2.6, -2.3, -0.2],
    color: "#4F46E5", // Deep Indigo
    category: "Vision & AI",
    icon: "👁️",
    labelOffset: [0, -0.78, 0],
  },

  // --- Software & Web Engineering Cluster ---
  "Software Engineer": {
    position: [0.4, 2.7, -0.4],
    color: "#8B5CF6", // Purple
    category: "Software Systems",
    icon: "💻",
    labelOffset: [0, 0.78, 0],
  },
  "Full Stack Developer": {
    position: [2.2, 1.5, 0.3],
    color: "#A855F7", // Violet
    category: "Web Engineering",
    icon: "🌐",
    labelOffset: [0, 0.78, 0],
  },
  "Frontend Developer": {
    position: [3.8, 2.6, -0.2],
    color: "#EC4899", // Pink
    category: "Client Engineering",
    icon: "🎨",
    labelOffset: [0, 0.78, 0],
  },
  "Backend Developer": {
    position: [-0.2, 1.4, -0.7],
    color: "#7C3AED", // Deep Violet
    category: "Server Architecture",
    icon: "🖧",
    labelOffset: [-0.35, 0.76, 0],
  },
  "Mobile App Developer": {
    position: [5.0, 0.8, 0.6],
    color: "#D946EF", // Fuchsia
    category: "Mobile Systems",
    icon: "📱",
    labelOffset: [0.35, 0.76, 0],
  },
  "UI/UX Designer": {
    position: [5.8, 2.2, 0.2],
    color: "#F43F5E", // Rose
    category: "Design & Product",
    icon: "✨",
    labelOffset: [0, 0.78, 0],
  },

  // --- Cloud & Operations Cluster ---
  "Cloud Engineer": {
    position: [2.6, -0.6, -0.5],
    color: "#F59E0B", // Amber
    category: "Cloud Systems",
    icon: "☁️",
    labelOffset: [0.35, 0.76, 0],
  },
  "DevOps Engineer": {
    position: [4.2, -1.4, -0.3],
    color: "#EAB308", // Yellow / Gold
    category: "DevOps & Release",
    icon: "🔄",
    labelOffset: [0, -0.78, 0],
  },
  "Site Reliability Engineer (SRE)": {
    position: [6.0, -0.6, -0.7],
    color: "#F97316", // Orange
    category: "Reliability & Observability",
    icon: "🛡️",
    labelOffset: [0.4, 0.76, 0],
  },

  // --- Cybersecurity & Specialized Cluster ---
  "Cybersecurity Engineer": {
    position: [0.2, -1.7, -0.5],
    color: "#EF4444", // Crimson
    category: "Security & Defense",
    icon: "🔒",
    labelOffset: [0, -0.78, 0],
  },
  "Security Analyst": {
    position: [1.8, -2.5, -0.2],
    color: "#DC2626", // Deep Red
    category: "Security Operations",
    icon: "🕵️",
    labelOffset: [0, -0.78, 0],
  },
  "Game Developer": {
    position: [5.8, -2.2, 0.3],
    color: "#FB923C", // Coral
    category: "Graphics & Gaming",
    icon: "🎮",
    labelOffset: [0, -0.78, 0],
  },
};

const getCareerConfig = (career, index, total) => {
  if (CAREER_METADATA[career]) return CAREER_METADATA[career];
  const angle = (index / total) * Math.PI * 2;
  return {
    position: [Math.cos(angle) * 5.2, Math.sin(angle) * 2.6, -0.4],
    color: "#3B82F6",
    category: "Career Pathway",
    icon: "✦",
    labelOffset: [0, 0.78, 0],
  };
};

/**
 * 3D Node representing a Career in the interactive constellation.
 * Dynamically highlights Current Role and Selected Target states.
 */
function CareerNode({
  career,
  position,
  color,
  size = 0.48,
  isCurrent = false,
  isSelected = false,
  isHovered = false,
  onHover,
  onClick,
  reducedMotion = false,
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const haloRef = useRef();
  const haloMatRef = useRef();
  const ringRef = useRef();
  const ringMatRef = useRef();
  const outerRingRef = useRef();
  const outerRingMatRef = useRef();

  // Scale and visual hierarchy values
  const baseScale = isCurrent ? 1.25 : isSelected ? 1.2 : 1.0;
  const hoverScale = isHovered ? 1.15 : 1.0;
  const targetScale = baseScale * hoverScale;

  const targetEmissive = isSelected
    ? (isHovered ? 2.5 : 2.0)
    : isCurrent
    ? (isHovered ? 2.0 : 1.4)
    : isHovered
    ? 1.2
    : 0.55;

  const targetHaloScale = isSelected ? 1.55 : isCurrent ? 1.45 : isHovered ? 1.35 : 1.22;
  const targetHaloOpacity = isSelected ? 0.35 : isCurrent ? 0.28 : isHovered ? 0.2 : 0.08;
  const targetRingOpacity = isSelected ? 0.9 : isCurrent ? 0.65 : isHovered ? 0.4 : 0;
  const targetOuterRingOpacity = isSelected ? 0.5 : isCurrent ? 0.35 : 0;

  const highlightColor = useMemo(
    () => new THREE.Color(isSelected ? "#3B82F6" : isCurrent ? "#10B981" : color),
    [isSelected, isCurrent, color]
  );

  useFrame((_, delta) => {
    if (reducedMotion) {
      if (meshRef.current) meshRef.current.scale.setScalar(targetScale);
      if (materialRef.current) {
        materialRef.current.emissiveIntensity = targetEmissive;
        materialRef.current.emissive.copy(highlightColor);
      }
      if (haloRef.current) haloRef.current.scale.setScalar(targetHaloScale);
      if (haloMatRef.current) haloMatRef.current.opacity = targetHaloOpacity;
      if (ringMatRef.current) ringMatRef.current.opacity = targetRingOpacity;
      if (outerRingMatRef.current) outerRingMatRef.current.opacity = targetOuterRingOpacity;
      return;
    }

    const lerpFactor = Math.min(1, delta * 8);

    if (meshRef.current) {
      const cur = meshRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetScale, lerpFactor);
      meshRef.current.scale.setScalar(next);
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        lerpFactor
      );
      materialRef.current.emissive.lerp(highlightColor, lerpFactor);
    }

    if (haloRef.current) {
      const cur = haloRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetHaloScale, lerpFactor);
      haloRef.current.scale.setScalar(next);
    }
    if (haloMatRef.current) {
      haloMatRef.current.opacity = THREE.MathUtils.lerp(
        haloMatRef.current.opacity,
        targetHaloOpacity,
        lerpFactor
      );
    }

    if (ringRef.current && ringMatRef.current) {
      ringMatRef.current.opacity = THREE.MathUtils.lerp(
        ringMatRef.current.opacity,
        targetRingOpacity,
        lerpFactor
      );
      ringRef.current.rotation.z += delta * (isSelected ? 0.9 : 0.5);
    }

    if (outerRingRef.current && outerRingMatRef.current) {
      outerRingMatRef.current.opacity = THREE.MathUtils.lerp(
        outerRingMatRef.current.opacity,
        targetOuterRingOpacity,
        lerpFactor
      );
      outerRingRef.current.rotation.z -= delta * 0.45;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : isCurrent ? 1.4 : isSelected ? 1.6 : 1.0}
      rotationIntensity={reducedMotion ? 0 : 0.08}
      floatIntensity={reducedMotion ? 0 : 0.22}
    >
      <group position={position}>
        {/* Core Career Sphere */}
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover?.(career, true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            onHover?.(career, false);
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            ref={materialRef}
            color={color}
            metalness={0.82}
            roughness={0.22}
            emissive={color}
            emissiveIntensity={0.6}
          />
        </mesh>

        {/* Ambient Halo */}
        <mesh ref={haloRef} scale={1.3}>
          <sphereGeometry args={[size, 24, 24]} />
          <meshBasicMaterial
            ref={haloMatRef}
            color={isCurrent ? "#10B981" : isSelected ? "#3B82F6" : color}
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Primary Telemetry Orbit Ring */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.36, size * 1.46, 48]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={isCurrent ? "#10B981" : "#3B82F6"}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Secondary Angled Ring */}
        <mesh ref={outerRingRef} rotation={[-Math.PI / 2.3, 0.25, 0]}>
          <ringGeometry args={[size * 1.60, size * 1.68, 48]} />
          <meshBasicMaterial
            ref={outerRingMatRef}
            color={isCurrent ? "#34D399" : "#60A5FA"}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * 3D Connection beam between two related career nodes.
 */
function CareerConnection({
  start,
  end,
  color = "#3B82F6",
  isPrimaryTrajectory = false,
  isRelatedToActive = false,
  reducedMotion = false,
}) {
  const startVector = useMemo(() => new THREE.Vector3(...start), [start]);
  const endVector = useMemo(() => new THREE.Vector3(...end), [end]);

  const innerMeshRef = useRef();
  const innerMatRef = useRef();
  const outerMeshRef = useRef();
  const outerMatRef = useRef();

  const { length, midpoint, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(endVector, startVector);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(startVector, endVector).multiplyScalar(0.5);
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { length: len, midpoint: mid, quaternion: quat };
  }, [startVector, endVector]);

  const targetInnerScale = isPrimaryTrajectory ? 2.2 : isRelatedToActive ? 1.4 : 1.0;
  const targetInnerOpacity = isPrimaryTrajectory ? 0.95 : isRelatedToActive ? 0.6 : 0.16;
  const targetOuterScale = isPrimaryTrajectory ? 2.0 : isRelatedToActive ? 1.3 : 1.0;
  const targetOuterOpacity = isPrimaryTrajectory ? 0.45 : isRelatedToActive ? 0.2 : 0.04;

  useFrame((_, delta) => {
    if (reducedMotion) {
      if (innerMeshRef.current) innerMeshRef.current.scale.set(targetInnerScale, 1, targetInnerScale);
      if (innerMatRef.current) innerMatRef.current.opacity = targetInnerOpacity;
      if (outerMeshRef.current) outerMeshRef.current.scale.set(targetOuterScale, 1, targetOuterScale);
      if (outerMatRef.current) outerMatRef.current.opacity = targetOuterOpacity;
      return;
    }

    const lerpFactor = Math.min(1, delta * 7);

    if (innerMeshRef.current) {
      const cur = innerMeshRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetInnerScale, lerpFactor);
      innerMeshRef.current.scale.set(next, 1, next);
    }
    if (innerMatRef.current) {
      innerMatRef.current.opacity = THREE.MathUtils.lerp(
        innerMatRef.current.opacity,
        targetInnerOpacity,
        lerpFactor
      );
    }

    if (outerMeshRef.current) {
      const cur = outerMeshRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, targetOuterScale, lerpFactor);
      outerMeshRef.current.scale.set(next, 1, next);
    }
    if (outerMatRef.current) {
      outerMatRef.current.opacity = THREE.MathUtils.lerp(
        outerMatRef.current.opacity,
        targetOuterOpacity,
        lerpFactor
      );
    }
  });

  return (
    <group position={midpoint} quaternion={quaternion}>
      {/* Inner Core Beam */}
      <mesh ref={innerMeshRef}>
        <cylinderGeometry args={[0.016, 0.016, length, 8]} />
        <meshBasicMaterial
          ref={innerMatRef}
          color={isPrimaryTrajectory ? "#3B82F6" : color}
          transparent
          opacity={targetInnerOpacity}
        />
      </mesh>

      {/* Outer Glow Sheath */}
      <mesh ref={outerMeshRef}>
        <cylinderGeometry args={[0.040, 0.040, length, 8]} />
        <meshBasicMaterial
          ref={outerMatRef}
          color={isPrimaryTrajectory ? "#60A5FA" : color}
          transparent
          opacity={targetOuterOpacity}
        />
      </mesh>
    </group>
  );
}

/**
 * Animated Particle flowing along career trajectories.
 */
function CareerParticle({
  start,
  end,
  color = "#3B82F6",
  speed = 0.45,
  offset = 0,
  isPrimaryTrajectory = false,
  reducedMotion = false,
}) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;

    const currentSpeed = isPrimaryTrajectory ? speed * 1.5 : speed;
    const progress = (clock.getElapsedTime() * currentSpeed + offset) % 1;

    ref.current.position.x = start[0] + (end[0] - start[0]) * progress;
    ref.current.position.y = start[1] + (end[1] - start[1]) * progress;
    ref.current.position.z = start[2] + (end[2] - start[2]) * progress;
  });

  if (reducedMotion) return null;

  return (
    <mesh ref={ref} position={start}>
      <sphereGeometry args={[isPrimaryTrajectory ? 0.095 : 0.060, 14, 14]} />
      <meshBasicMaterial
        color={isPrimaryTrajectory ? "#60A5FA" : color}
        transparent
        opacity={isPrimaryTrajectory ? 0.9 : 0.6}
      />
    </mesh>
  );
}

/**
 * Smooth Camera controller that frames the active career trajectory without abrupt jumps.
 */
function CameraController({
  controlsRef,
  reducedMotion,
  selectedCareer,
  role,
  careerNodesData,
  isAnimating,
}) {
  const defaultPosition = useMemo(() => new THREE.Vector3(0, 0.2, 10.6), []);
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 0.1, 0), []);

  useFrame(({ camera }, delta) => {
    if (reducedMotion) return;

    let targetPos = defaultPosition;
    let lookTarget = defaultTarget;

    if (selectedCareer && careerNodesData) {
      const selectedNode = careerNodesData.find((n) => n.name === selectedCareer);
      const roleNode = careerNodesData.find((n) => n.name === role);

      if (selectedNode) {
        const sPos = selectedNode.position;
        const rPos = roleNode ? roleNode.position : [0, 0, 0];

        // Smooth midpoint vantage framing both the current role and target
        const midX = sPos[0] * 0.6 + rPos[0] * 0.4;
        const midY = sPos[1] * 0.6 + rPos[1] * 0.4;

        lookTarget = new THREE.Vector3(midX * 0.5, midY * 0.5 + 0.1, 0);
        targetPos = new THREE.Vector3(midX * 0.4, midY * 0.4 + 0.35, 9.0);
      }
    }

    const lerpSpeed = Math.min(1, delta * (isAnimating ? 4.5 : 2.5));
    camera.position.lerp(targetPos, lerpSpeed);

    if (controlsRef?.current) {
      controlsRef.current.target.lerp(lookTarget, lerpSpeed);
      controlsRef.current.update();
    } else {
      camera.lookAt(lookTarget);
    }
  });

  return null;
}

/**
 * Projects 3D node world coordinates into 2D HTML pixel space every frame.
 */
function SceneLabelsProjector({ careerNodes, containerRef }) {
  const tempV = useMemo(() => new THREE.Vector3(), []);
  const elementsRef = useRef({});

  useFrame(({ camera, size }) => {
    const container = containerRef.current;
    if (!container) return;

    careerNodes.forEach(({ name, position, labelOffset }) => {
      if (!elementsRef.current[name]) {
        elementsRef.current[name] = container.querySelector(`[data-scene-node="${name}"]`);
      }
      const el = elementsRef.current[name];
      if (!el) return;

      tempV.set(
        position[0] + (labelOffset ? labelOffset[0] : 0),
        position[1] + (labelOffset ? labelOffset[1] : 0.78),
        position[2] + (labelOffset ? labelOffset[2] : 0)
      );
      tempV.project(camera);
      const isVisible = tempV.z <= 1;
      const x = ((tempV.x + 1) / 2) * size.width;
      const y = ((-tempV.y + 1) / 2) * size.height;

      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = isVisible ? "1" : "0";
    });
  });

  return null;
}

/**
 * Main Interactive 3D Career Simulation Component
 */
export default function CareerScene(props) {
  const careerCtx = useCareer?.() || {};
  const navigate = useNavigate();

  const role = props.role || careerCtx.role || "Data Analyst";
  const selectedCareer = props.selectedCareer !== undefined ? props.selectedCareer : careerCtx.selectedCareer;
  const onCareerSelect = props.onCareerSelect || careerCtx.setSelectedCareer;
  const buildRoadmap = props.buildRoadmap !== undefined ? props.buildRoadmap : careerCtx.buildRoadmap;
  const profile = props.profile || careerCtx.profile;
  const mlProject = props.mlProject !== undefined ? props.mlProject : careerCtx.mlProject;
  const handleTriggerRoadmapAnimation = props.handleTriggerRoadmapAnimation || careerCtx.handleTriggerRoadmapAnimation;

  const containerRef = useRef(null);
  const controlsRef = useRef(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredCareer, setHoveredCareer] = useState(null);

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e) => setReducedMotion(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Trigger camera easing on roadmap transition
  useEffect(() => {
    if (!buildRoadmap) return;
    const animTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 0);
    const stopTimer = setTimeout(() => setIsAnimating(false), 2200);
    return () => {
      clearTimeout(animTimer);
      clearTimeout(stopTimer);
    };
  }, [buildRoadmap]);

  // All 20 careers represented in the 3D galaxy
  const allCareerNames = useMemo(() => Object.keys(careerData), []);

  const careerNodesData = useMemo(() => {
    return allCareerNames.map((career, idx) => {
      const cfg = getCareerConfig(career, idx, allCareerNames.length);
      return {
        name: career,
        position: cfg.position,
        color: cfg.color,
        category: cfg.category,
        icon: cfg.icon,
        labelOffset: cfg.labelOffset,
      };
    });
  }, [allCareerNames]);

  // Construct deduplicated graph connections from existing careerPaths data
  const careerConnections = useMemo(() => {
    const edgeMap = new Map();

    Object.entries(careerPaths).forEach(([fromRole, targets]) => {
      if (!CAREER_METADATA[fromRole]) return;
      targets.forEach((toRole) => {
        if (!CAREER_METADATA[toRole]) return;
        const key = [fromRole, toRole].sort().join("<->");
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            from: fromRole,
            to: toRole,
            start: CAREER_METADATA[fromRole].position,
            end: CAREER_METADATA[toRole].position,
            color: CAREER_METADATA[fromRole].color,
          });
        }
      });
    });

    return Array.from(edgeMap.values());
  }, []);

  // Active direct transition conduit connecting current role to selected career
  const directTransitionPath = useMemo(() => {
    if (!selectedCareer || selectedCareer === role) return null;
    const startPos = CAREER_METADATA[role]?.position;
    const endPos = CAREER_METADATA[selectedCareer]?.position;
    if (!startPos || !endPos) return null;

    return {
      from: role,
      to: selectedCareer,
      start: startPos,
      end: endPos,
      color: "#3B82F6",
    };
  }, [role, selectedCareer]);

  const handleHover = useCallback((career, isHovered) => {
    setHoveredCareer(isHovered ? career : null);
  }, []);

  // Compute live match scores for selected and hovered careers using existing scoring logic
  const selectedScore = useMemo(() => {
    if (!selectedCareer) return 0;
    return getScore(selectedCareer, profile, mlProject);
  }, [selectedCareer, profile, mlProject]);

  const selectedMatched = useMemo(() => {
    if (!selectedCareer) return [];
    return getMatchedSkills(selectedCareer, profile, mlProject);
  }, [selectedCareer, profile, mlProject]);

  const selectedMissing = useMemo(() => {
    if (!selectedCareer) return [];
    return getMissingSkills(selectedCareer, profile, mlProject);
  }, [selectedCareer, profile, mlProject]);

  const selectedInfo = selectedCareer ? careerData[selectedCareer] : null;
  const selectedTotalSkills = selectedInfo?.skills?.length || 4;
  const selectedMetadata = selectedCareer ? CAREER_METADATA[selectedCareer] : null;

  const hoveredScore = useMemo(() => {
    if (!hoveredCareer) return 0;
    return getScore(hoveredCareer, profile, mlProject);
  }, [hoveredCareer, profile, mlProject]);

  const hoveredInfo = hoveredCareer ? careerData[hoveredCareer] : null;

  const handleBuildRoadmapClick = () => {
    if (selectedCareer) {
      if (handleTriggerRoadmapAnimation) {
        handleTriggerRoadmapAnimation(selectedCareer);
      }
      setTimeout(() => {
        navigate("/roadmap");
      }, 450);
    }
  };

  const handleExplorePathwayClick = () => {
    navigate("/simulator");
  };

  return (
    <div className="career-scene-container" ref={containerRef}>
      <Canvas
        gl={{ alpha: true }}
        camera={{
          position: [0, 0.2, 10.6],
          fov: 44,
        }}
      >
        <CameraController
          controlsRef={controlsRef}
          reducedMotion={reducedMotion}
          selectedCareer={selectedCareer}
          role={role}
          careerNodesData={careerNodesData}
          isAnimating={isAnimating}
        />

        <ambientLight intensity={0.65} />

        <directionalLight
          position={[5, 6, 6]}
          intensity={1.8}
        />

        <pointLight
          position={[0, 0, 1]}
          intensity={1.6}
          distance={12}
          color="#3B82F6"
        />

        <pointLight
          position={[-4, 2, 2]}
          intensity={1.2}
          distance={10}
          color="#10B981"
        />

        <pointLight
          position={[4, -2, 2]}
          intensity={1.2}
          distance={10}
          color="#8B5CF6"
        />

        {/* Constellation Network Connections */}
        {careerConnections.map((conn) => {
          const isPrimary =
            (conn.from === role && conn.to === selectedCareer) ||
            (conn.from === selectedCareer && conn.to === role);
          const isRelated =
            conn.from === selectedCareer ||
            conn.to === selectedCareer ||
            conn.from === role ||
            conn.to === role;

          return (
            <CareerConnection
              key={`conn-${conn.from}-${conn.to}`}
              start={conn.start}
              end={conn.end}
              color={conn.color}
              isPrimaryTrajectory={isPrimary}
              isRelatedToActive={isRelated}
              reducedMotion={reducedMotion}
            />
          );
        })}

        {/* Dedicated Direct Transition Conduit when Target is Selected */}
        {directTransitionPath && (
          <group key="direct-transition">
            <CareerConnection
              start={directTransitionPath.start}
              end={directTransitionPath.end}
              color="#3B82F6"
              isPrimaryTrajectory={true}
              isRelatedToActive={true}
              reducedMotion={reducedMotion}
            />
            <CareerParticle
              start={directTransitionPath.start}
              end={directTransitionPath.end}
              color="#60A5FA"
              speed={0.5}
              isPrimaryTrajectory={true}
              reducedMotion={reducedMotion}
            />
            <CareerParticle
              start={directTransitionPath.start}
              end={directTransitionPath.end}
              color="#3B82F6"
              speed={0.5}
              offset={0.5}
              isPrimaryTrajectory={true}
              reducedMotion={reducedMotion}
            />
          </group>
        )}

        {/* All 20 Career Nodes in 3D Galaxy */}
        {careerNodesData.map((node) => {
          const isCurrent = node.name === role;
          const isSelected = selectedCareer === node.name;
          const isHovered = hoveredCareer === node.name;

          return (
            <CareerNode
              key={`node-${node.name}`}
              career={node.name}
              position={node.position}
              color={node.color}
              isCurrent={isCurrent}
              isSelected={isSelected}
              isHovered={isHovered}
              onHover={handleHover}
              onClick={() => onCareerSelect?.(node.name)}
              reducedMotion={reducedMotion}
            />
          );
        })}

        <gridHelper
          args={[28, 28, "#1E293B", "#0F172A"]}
          position={[0, -3.8, 0]}
        />

        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.85}
          autoRotate={!reducedMotion && !selectedCareer && !hoveredCareer}
          autoRotateSpeed={0.25}
        />

        {/* Synchronize 3D node world coordinates into 2D HTML pixel space */}
        <SceneLabelsProjector
          careerNodes={careerNodesData}
          containerRef={containerRef}
        />
      </Canvas>

      {/* Synchronized 2D HTML Labels Overlay for all 20 Nodes */}
      <div className="scene-overlay-labels">
        {careerNodesData.map((node) => {
          const isCurrent = node.name === role;
          const isSelected = selectedCareer === node.name;
          const isHovered = hoveredCareer === node.name;
          const nodeScore = isSelected
            ? selectedScore
            : isHovered
            ? hoveredScore
            : 0;

          return (
            <div
              key={`label-${node.name}`}
              data-scene-node={node.name}
              className={`scene-node-label ${isCurrent ? "origin-label" : "career-label"} ${
                isSelected ? "selected" : ""
              } ${isHovered ? "hovered" : ""} ${!isCurrent && !isSelected && !isHovered ? "compact" : ""}`}
              onClick={() => onCareerSelect?.(node.name)}
              onMouseEnter={() => handleHover(node.name, true)}
              onMouseLeave={() => handleHover(node.name, false)}
            >
              <div className="scene-label-tag">
                {isCurrent ? (
                  <>
                    <span className="scene-pulse-dot current" />
                    CURRENT ROLE
                  </>
                ) : isSelected ? (
                  <>
                    <span className="scene-pulse-dot target" />
                    TARGET • {nodeScore}% MATCH
                  </>
                ) : isHovered ? (
                  <>
                    <span>✦</span>
                    {nodeScore}% MATCH
                  </>
                ) : (
                  <span>✦</span>
                )}
              </div>
              <div className="scene-label-title">{node.name}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive 3D Career Telemetry HUD Bar */}
      <div className="scene-telemetry-hud">
        {selectedCareer ? (
          <div className="scene-hud-card active">
            <div className="scene-hud-left">
              <div className="scene-hud-eyebrow">
                <span className="scene-hud-pulse" />
                ACTIVE CAREER TRAJECTORY
              </div>
              <div className="scene-hud-title-row">
                <span className="scene-hud-role">{role}</span>
                <span className="scene-hud-arrow">➔</span>
                <span className="scene-hud-target">{selectedCareer}</span>
                <span className="scene-hud-score-badge">
                  {selectedScore}% Readiness
                </span>
              </div>
              <div className="scene-hud-cluster-tag">
                {selectedMetadata?.category || "Career Pathway"} • Est. Prep: {selectedInfo?.time || "4–6 months"}
              </div>
            </div>

            <div className="scene-hud-middle">
              <div className="scene-hud-skills-header">
                <span>Competency Coverage:</span>
                <strong>{selectedMatched.length} / {selectedTotalSkills} core skills</strong>
              </div>
              <div className="scene-hud-skills-pills">
                {selectedMatched.slice(0, 3).map((s) => (
                  <span key={s} className="scene-skill-pill matched">✓ {s}</span>
                ))}
                {selectedMissing.slice(0, 2).map((s) => (
                  <span key={s} className="scene-skill-pill missing">✕ {s}</span>
                ))}
                {selectedMissing.length > 2 && (
                  <span className="scene-skill-pill more">+{selectedMissing.length - 2} more</span>
                )}
              </div>
            </div>

            <div className="scene-hud-actions">
              <button
                type="button"
                className="scene-hud-btn primary"
                onClick={handleBuildRoadmapClick}
                title="Build step-by-step roadmap for this target career"
              >
                Build Roadmap →
              </button>
              <button
                type="button"
                className="scene-hud-btn secondary"
                onClick={handleExplorePathwayClick}
                title="View detailed simulator comparison"
              >
                Compare Pathway
              </button>
              <button
                type="button"
                className="scene-hud-btn icon-btn"
                onClick={() => onCareerSelect?.(null)}
                title="Return to constellation overview"
              >
                ✕
              </button>
            </div>
          </div>
        ) : hoveredCareer && hoveredCareer !== role ? (
          <div className="scene-hud-card hover-preview">
            <div className="scene-hud-left">
              <div className="scene-hud-eyebrow">
                <span>PATHWAY PREVIEW</span>
              </div>
              <div className="scene-hud-title-row">
                <span className="scene-hud-role">{role}</span>
                <span className="scene-hud-arrow">➔</span>
                <span className="scene-hud-target">{hoveredCareer}</span>
                <span className="scene-hud-score-badge">
                  {hoveredScore}% Match
                </span>
              </div>
              <p className="scene-hud-desc">{hoveredInfo?.description}</p>
            </div>
            <div className="scene-hud-actions">
              <button
                type="button"
                className="scene-hud-btn primary"
                onClick={() => onCareerSelect?.(hoveredCareer)}
              >
                Select {hoveredCareer} →
              </button>
            </div>
          </div>
        ) : (
          <div className="scene-hud-card idle">
            <div className="scene-hud-idle-content">
              <span className="scene-hud-compass">🧭</span>
              <div>
                <strong>Interactive Career Constellation</strong>
                <span className="scene-hud-idle-sub">
                  All 20 career pathways rendered. Click any node to benchmark readiness, view required skills, and simulate transitions.
                </span>
              </div>
            </div>
            <div className="scene-hud-legend">
              <span className="legend-item"><span className="legend-dot origin" /> Current: {role}</span>
              <span className="legend-item"><span className="legend-dot target" /> Click to Target</span>
              <span className="legend-item"><span className="legend-dot connection" /> Pathway Links</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
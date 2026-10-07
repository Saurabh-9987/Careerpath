import { useMemo, useEffect, useRef, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { careerPaths, availableRoles } from "../data/careerData";
import { getScore } from "../utils/careerScoring";
import WhatIfSimulator from "./WhatIfSimulator";
import CareerDetail from "./CareerDetail";
import GlowSeparator from "./GlowSeparator";

function getCareerId(career) {
  if (career === "Data Scientist") return "ds";
  if (career === "Data Engineer") return "de";
  if (career === "ML Engineer") return "ml";
  return career.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function getIdToCareer(id, paths) {
  const careerMap = {
    ds: "Data Scientist",
    de: "Data Engineer",
    ml: "ML Engineer",
  };
  return careerMap[id] || (paths ? paths.find((p) => getCareerId(p) === id) : null);
}

// Custom Node for "YOU ARE HERE" (Source Handle on Right)
function CurrentRoleNode({ data }) {
  return (
    <div className="simulator-custom-node simulator-current-node">
      <small className="node-eyebrow">YOU ARE HERE</small>
      <strong className="node-title">{data.role}</strong>
      <Handle
        type="source"
        position={Position.Right}
        id="right-out"
        className="simulator-handle"
      />
    </div>
  );
}

// Custom Node for Career Paths (Target Handle on Left)
function CareerPathNode({ data }) {
  return (
    <div
      className={`simulator-custom-node simulator-career-node ${
        data.isSelected ? "selected" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="left-in"
        className="simulator-handle"
      />
      <small className={data.isSelected ? "node-tag selected-tag" : "node-tag"}>
        {data.isSelected ? "SELECTED PATH" : "POSSIBLE PATH"}
      </small>
      <strong className="node-title">{data.career}</strong>
      <b className="node-score">{data.score}%</b>
    </div>
  );
}

const nodeTypes = {
  currentRole: CurrentRoleNode,
  careerPath: CareerPathNode,
};

function SimulatorGraph({
  role,
  availablePaths,
  profile,
  mlProject,
  selectedCareer,
  onCareerSelect,
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const prevRoleRef = useRef(role);

  // Synchronize nodes with roles, paths, scoring, and selection state
  useEffect(() => {
    const roleChanged = prevRoleRef.current !== role;
    prevRoleRef.current = role;

    setNodes((prevNodes) => {
      // If role changed, reset to default clean layout; otherwise preserve user's dragged positions
      const prevPositions = roleChanged
        ? new Map()
        : new Map(prevNodes.map((n) => [n.id, n.position]));

      const defaultY =
        availablePaths.length === 2
          ? [90, 250]
          : [40, 170, 300];

      const currentPos = prevPositions.get("current") || { x: 50, y: 170 };

      return [
        {
          id: "current",
          type: "currentRole",
          position: currentPos,
          data: { role },
        },
        ...availablePaths.map((career, index) => {
          const id = getCareerId(career);
          const isSelected = career === selectedCareer;
          const score = getScore(career, profile, mlProject);
          const pos = prevPositions.get(id) || {
            x: 390,
            y: defaultY[index] ?? (40 + index * 130),
          };

          return {
            id,
            type: "careerPath",
            position: pos,
            data: {
              career,
              isSelected,
              score,
            },
          };
        }),
      ];
    });
  }, [role, availablePaths, selectedCareer, profile, mlProject, setNodes]);

  // Handle window resizing and role changes to keep nodes framed nicely
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.22, duration: 300 });
    }, 60);

    const handleResize = () => {
      fitView({ padding: 0.22, duration: 150 });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [role, fitView]);

  // Edges connecting source handle to target handles
  const edges = useMemo(() => {
    return availablePaths.map((career) => {
      const targetId = getCareerId(career);
      const isSelected = career === selectedCareer;
      return {
        id: `edge-${role}-${targetId}`,
        source: "current",
        sourceHandle: "right-out",
        target: targetId,
        targetHandle: "left-in",
        animated: true,
        style: {
          stroke: isSelected ? "#3B82F6" : "rgba(255, 255, 255, 0.25)",
          strokeWidth: isSelected ? 2.5 : 1.5,
          strokeDasharray: isSelected ? undefined : "6 4",
        },
      };
    });
  }, [availablePaths, role, selectedCareer]);

  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.id === "current") return;
      const career =
        node.data?.career || getIdToCareer(node.id, availablePaths);
      if (career) {
        onCareerSelect(career);
      }
    },
    [availablePaths, onCareerSelect]
  );

  return (
    <div className="graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        preventScrolling={false}
      >
        <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />
        <Controls />
        <MiniMap
          bgColor="#0A0A0A"
          maskColor="rgba(0, 0, 0, 0.75)"
          nodeColor={(node) => {
            if (node.id === "current") return "#3B82F6";
            if (node.data?.isSelected) return "#60A5FA";
            return "rgba(255, 255, 255, 0.2)";
          }}
          nodeStrokeColor="#3B82F6"
          nodeBorderRadius={4}
        />
      </ReactFlow>
    </div>
  );
}

export default function Simulator({
  role,
  onRoleChange,
  profile,
  selectedCareer,
  onCareerSelect,
  mlProject,
  onToggleMlProject,
  onBuildRoadmap,
}) {
  const availablePaths = useMemo(() => {
    return careerPaths[role] || [
      "Data Scientist",
      "Data Engineer",
      "ML Engineer",
    ];
  }, [role]);

  const activeCareer = selectedCareer || availablePaths[0] || "Data Scientist";

  return (
    <section id="simulator" className="simulator">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 — SIMULATE</p>
          <h2>Your Possible Career Paths</h2>
        </div>

        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
        >
          {availableRoles.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
      </div>

      <GlowSeparator style={{ margin: "24px auto 36px" }} />

      <div className="career-layout">
        <ReactFlowProvider>
          <SimulatorGraph
            role={role}
            availablePaths={availablePaths}
            profile={profile}
            mlProject={mlProject}
            selectedCareer={selectedCareer}
            onCareerSelect={onCareerSelect}
          />
        </ReactFlowProvider>

        <WhatIfSimulator
          activeCareer={activeCareer}
          profile={profile}
          mlProject={mlProject}
          onToggleMlProject={onToggleMlProject}
        />
      </div>

      {!selectedCareer && (
        <div
          className="simulator-guidance"
          style={{
            marginTop: "20px",
            padding: "24px 28px",
            background: "#0A0A0A",
            border: "1px dashed rgba(255, 255, 255, 0.16)",
            borderRadius: "18px",
            backdropFilter: "blur(15px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px", maxWidth: "620px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              🧭
            </div>
            <div>
              <p
                style={{
                  color: "#60A5FA",
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Interactive Simulator
              </p>
              <h3
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  margin: "0 0 4px 0",
                }}
              >
                Select a Career Pathway
              </h3>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                Click a destination node on the graph above or select a pathway below to view requirements, competency match, and transition steps.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {availablePaths.map((career) => (
              <button
                key={career}
                type="button"
                className="secondary-button"
                style={{ padding: "10px 16px", fontSize: "13px" }}
                onClick={() => onCareerSelect(career)}
              >
                Select {career} →
              </button>
            ))}
          </div>
        </div>
      )}

      <CareerDetail
        selectedCareer={selectedCareer}
        profile={profile}
        mlProject={mlProject}
        onBuildRoadmap={onBuildRoadmap}
      />
    </section>
  );
}

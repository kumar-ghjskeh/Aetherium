import React from "react";

import { useWorldInteractionStore } from "../../state/interaction-store";

export function DiagnosticInteractionMarkers(): React.ReactElement {
  const activeInteractionId = useWorldInteractionStore((state) => state.activeInteractionId);
  const interactions = useWorldInteractionStore((state) => state.interactions);

  return (
    <>
      {interactions.map((interaction) => {
        const active = interaction.id === activeInteractionId;
        const color = active ? "#82e6f0" : "#6e7f86";
        return (
          <group key={interaction.id} position={interaction.position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42, active ? 0.035 : 0.025, 8, 30]} />
              <meshStandardMaterial
                color={color}
                emissive={active ? "#145b66" : "#101820"}
                emissiveIntensity={active ? 0.85 : 0.18}
                roughness={0.48}
              />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 0.8, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={active ? "#145b66" : "#111820"}
                emissiveIntensity={active ? 0.6 : 0.16}
                roughness={0.54}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

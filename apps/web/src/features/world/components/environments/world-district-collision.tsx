import { CylinderCollider, RigidBody } from "@react-three/rapier";
import React from "react";

import { resolveDistrictCollisionProfile } from "../../engine/district-collision-system";
import type { WorldDestination } from "../../engine/navigation-system";
import { useWorldNavigationStore } from "../../state/navigation-store";

export function WorldDistrictCollision({
  destinations
}: Readonly<{ destinations: WorldDestination[] }>): React.ReactElement | null {
  const destinationId = useWorldNavigationStore((state) => state.destinationId);
  const destination = destinations.find((candidate) => candidate.id === destinationId);

  if (!destination) {
    return null;
  }

  const profile = resolveDistrictCollisionProfile(destination);

  return (
    <RigidBody colliders={false} position={profile.position} type="fixed">
      <CylinderCollider
        args={[profile.halfHeight, profile.radius]}
        friction={0.72}
        restitution={0.02}
      />
    </RigidBody>
  );
}

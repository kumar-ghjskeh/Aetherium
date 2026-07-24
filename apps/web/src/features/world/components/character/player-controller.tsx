import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import { createMovementIntent } from "../../engine/input-system";
import {
  applyPlanarAcceleration,
  resolveFacingRadians,
  resolvePlayerMovementState,
  type PlanarVelocity
} from "../../engine/player-controller";
import { isInsideTerrainBounds } from "../../engine/terrain-system";
import { useWorldInput } from "../../hooks/use-world-input";
import { usePlayerStore } from "../../state/player-store";
import { PlayerAvatar } from "./player-avatar";

export function PlayerController({
  reducedMotion
}: Readonly<{
  reducedMotion: boolean;
}>): React.ReactElement {
  useWorldInput();

  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const avatarRootRef = React.useRef<THREE.Group>(null);
  const velocityRef = React.useRef<PlanarVelocity>({ x: 0, z: 0 });
  const facingRadiansRef = React.useRef(0);
  const previousGroundedRef = React.useRef(true);
  const lastPublishedRef = React.useRef("");

  useFrame((_, delta) => {
    const body = rigidBodyRef.current;
    if (!body) {
      return;
    }

    const playerState = usePlayerStore.getState();
    const keySet = new Set(playerState.pressedKeys);
    const intent = createMovementIntent({
      gamepad: playerState.gamepadInput,
      keys: keySet
    });
    const actionState = {
      commandModeRequested: intent.commandModeRequested,
      interactionRequested: intent.interactRequested,
      mapRequested: intent.mapRequested
    };
    const currentTranslation = body.translation();
    const currentLinearVelocity = body.linvel();
    const grounded = currentTranslation.y <= 0.86 && Math.abs(currentLinearVelocity.y) < 0.45;
    const movementState = resolvePlayerMovementState({
      grounded,
      intent,
      interactionAligning: playerState.interactionAligning,
      movementDisabled: playerState.movementDisabled,
      paused: playerState.paused,
      previousGrounded: previousGroundedRef.current,
      reducedMotion
    });

    const velocity = applyPlanarAcceleration({
      currentVelocity: velocityRef.current,
      deltaSeconds: delta,
      intent,
      movementState,
      reducedMotion
    });

    velocityRef.current = velocity;
    facingRadiansRef.current = resolveFacingRadians(facingRadiansRef.current, intent, delta);

    body.setLinvel(
      {
        x: velocity.x,
        y: currentLinearVelocity.y,
        z: velocity.z
      },
      true
    );

    if (avatarRootRef.current) {
      avatarRootRef.current.rotation.y = facingRadiansRef.current;
    }

    if (
      currentTranslation.y < -12 ||
      !isInsideTerrainBounds([currentTranslation.x, currentTranslation.y, currentTranslation.z], 12)
    ) {
      body.setTranslation({ x: 0, y: 1.1, z: 0 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocityRef.current = { x: 0, z: 0 };
    }

    const planarSpeed = Math.hypot(velocity.x, velocity.z);
    const publishedKey = [
      movementState,
      grounded ? "grounded" : "airborne",
      planarSpeed.toFixed(1),
      currentTranslation.x.toFixed(1),
      currentTranslation.y.toFixed(1),
      currentTranslation.z.toFixed(1),
      actionState.commandModeRequested ? "command" : "no-command",
      actionState.interactionRequested ? "interact" : "no-interact",
      actionState.mapRequested ? "map" : "no-map"
    ].join(":");

    if (publishedKey !== lastPublishedRef.current) {
      const store = usePlayerStore.getState();
      store.setActionState(actionState);
      store.setPlayerRuntimeState({
        facingRadians: facingRadiansRef.current,
        grounded,
        movementState,
        planarSpeed,
        position: [currentTranslation.x, currentTranslation.y, currentTranslation.z],
        velocity
      });
      lastPublishedRef.current = publishedKey;
    }

    previousGroundedRef.current = grounded;
  });

  return (
    <RigidBody
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={0.18}
      lockRotations
      position={[0, 1.1, 4]}
      ref={rigidBodyRef}
    >
      <CapsuleCollider args={[0.46, 0.34]} />
      <group ref={avatarRootRef}>
        <PlayerAvatar />
      </group>
    </RigidBody>
  );
}

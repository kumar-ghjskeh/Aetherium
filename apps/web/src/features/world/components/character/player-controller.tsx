import { CapsuleCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import React from "react";
import type * as THREE from "three";

import { createMovementIntent } from "../../engine/input-system";
import {
  applyPlanarAcceleration,
  resolveFacingRadians,
  resolvePlayerMovementState,
  resolveTerrainGrounding,
  type PlanarVelocity
} from "../../engine/player-controller";
import { isInsideTerrainBounds, sampleTerrain } from "../../engine/terrain-system";
import {
  PLAYER_GROUND_CLEARANCE_METERS,
  sampleWorldTravelPlan,
  type WorldDestination
} from "../../engine/navigation-system";
import { useWorldInput } from "../../hooks/use-world-input";
import { usePlayerStore } from "../../state/player-store";
import { useWorldNavigationStore } from "../../state/navigation-store";
import { PlayerAvatar } from "./player-avatar";

export function PlayerController({
  initialFacingRadians = 0,
  initialPosition,
  onArrive,
  reducedMotion
}: Readonly<{
  initialFacingRadians?: number | undefined;
  initialPosition?: readonly [number, number, number] | undefined;
  onArrive: (destination: WorldDestination) => Promise<void> | void;
  reducedMotion: boolean;
}>): React.ReactElement {
  useWorldInput();

  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const avatarRootRef = React.useRef<THREE.Group>(null);
  const velocityRef = React.useRef<PlanarVelocity>({ x: 0, z: 0 });
  const facingRadiansRef = React.useRef(initialFacingRadians);
  const previousGroundedRef = React.useRef(true);
  const lastPublishedRef = React.useRef("");

  useFrame((_, delta) => {
    const body = rigidBodyRef.current;
    if (!body) {
      return;
    }

    const playerState = usePlayerStore.getState();
    if (playerState.pendingTeleport) {
      const [x, y, z] = playerState.pendingTeleport;
      body.setTranslation({ x, y, z }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocityRef.current = { x: 0, z: 0 };
      playerState.setPlayerRuntimeState({
        facingRadians: facingRadiansRef.current,
        grounded: true,
        movementState: "idle",
        planarSpeed: 0,
        position: [x, y, z],
        velocity: { x: 0, z: 0 }
      });
      useWorldNavigationStore.getState().beginArrivalFraming();
      playerState.consumeTeleport();
      return;
    }
    const navigationState = useWorldNavigationStore.getState();
    if (navigationState.activeTravel) {
      const plan = navigationState.activeTravel;
      const sample = navigationState.skipRequested
        ? { complete: true, position: plan.target.point, progress: 1 }
        : sampleWorldTravelPlan(plan, performance.now());
      const travelVelocity = sample.complete
        ? { x: 0, z: 0 }
        : {
            x: (plan.target.point[0] - sample.position[0]) / Math.max(plan.durationSeconds, 1),
            z: (plan.target.point[2] - sample.position[2]) / Math.max(plan.durationSeconds, 1)
          };

      body.setTranslation(
        { x: sample.position[0], y: sample.position[1], z: sample.position[2] },
        true
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocityRef.current = travelVelocity;
      const travelFacing = Math.atan2(
        plan.target.point[0] - sample.position[0],
        plan.target.point[2] - sample.position[2]
      );
      if (Number.isFinite(travelFacing)) {
        facingRadiansRef.current = travelFacing;
      }
      if (avatarRootRef.current) {
        avatarRootRef.current.rotation.y = facingRadiansRef.current;
      }
      playerState.setPlayerRuntimeState({
        facingRadians: facingRadiansRef.current,
        grounded: sample.complete,
        movementState: sample.complete ? "idle" : "jog",
        planarSpeed: Math.hypot(travelVelocity.x, travelVelocity.z),
        position: sample.position,
        velocity: travelVelocity
      });

      if (sample.complete) {
        navigationState.completeTravel();
        void onArrive(plan.target);
      }
      return;
    }
    const keySet = new Set(playerState.pressedKeys);
    const intent = createMovementIntent({
      gamepad: playerState.gamepadInput,
      keys: keySet
    });
    const actionState = playerState.movementDisabled
      ? {
          commandModeRequested: false,
          interactionRequested: false,
          mapRequested: false
        }
      : {
          commandModeRequested: intent.commandModeRequested,
          interactionRequested: intent.interactRequested,
          mapRequested: intent.mapRequested
        };
    const currentTranslation = body.translation();
    const currentLinearVelocity = body.linvel();
    const groundHeight = sampleTerrain(currentTranslation.x, currentTranslation.z).height;
    const grounding = resolveTerrainGrounding({
      clearance: PLAYER_GROUND_CLEARANCE_METERS,
      groundHeight,
      positionY: currentTranslation.y,
      velocityY: currentLinearVelocity.y
    });
    const resolvedTranslation = {
      x: currentTranslation.x,
      y: grounding.positionY,
      z: currentTranslation.z
    };
    if (grounding.corrected) {
      body.setTranslation(resolvedTranslation, true);
      body.setLinvel(
        { x: currentLinearVelocity.x, y: grounding.velocityY, z: currentLinearVelocity.z },
        true
      );
    }
    const grounded = grounding.grounded;
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
        y: grounding.velocityY,
        z: velocity.z
      },
      true
    );

    if (avatarRootRef.current) {
      avatarRootRef.current.rotation.y = facingRadiansRef.current;
    }

    if (
      resolvedTranslation.y < -12 ||
      !isInsideTerrainBounds(
        [resolvedTranslation.x, resolvedTranslation.y, resolvedTranslation.z],
        12
      )
    ) {
      body.setTranslation(
        { x: 0, y: sampleTerrain(0, 0).height + PLAYER_GROUND_CLEARANCE_METERS, z: 0 },
        true
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocityRef.current = { x: 0, z: 0 };
    }

    const planarSpeed = Math.hypot(velocity.x, velocity.z);
    const publishedKey = [
      movementState,
      grounded ? "grounded" : "airborne",
      planarSpeed.toFixed(1),
      resolvedTranslation.x.toFixed(1),
      resolvedTranslation.y.toFixed(1),
      resolvedTranslation.z.toFixed(1),
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
        position: [resolvedTranslation.x, resolvedTranslation.y, resolvedTranslation.z],
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
      position={
        initialPosition ?? [0, sampleTerrain(0, 4).height + PLAYER_GROUND_CLEARANCE_METERS, 4]
      }
      ref={rigidBodyRef}
    >
      <CapsuleCollider args={[0.46, 0.34]} />
      <group ref={avatarRootRef}>
        <PlayerAvatar />
      </group>
    </RigidBody>
  );
}

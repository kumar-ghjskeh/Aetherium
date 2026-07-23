import React from "react";

import { WorldRuntimeFallback } from "../ui/world-runtime-fallback";

interface WorldRuntimeErrorBoundaryProps {
  children: React.ReactNode;
}

interface WorldRuntimeErrorBoundaryState {
  error: Error | null;
}

export class WorldRuntimeErrorBoundary extends React.Component<
  WorldRuntimeErrorBoundaryProps,
  WorldRuntimeErrorBoundaryState
> {
  public override state: WorldRuntimeErrorBoundaryState = {
    error: null
  };

  public static getDerivedStateFromError(error: Error): WorldRuntimeErrorBoundaryState {
    return { error };
  }

  public override componentDidCatch(error: Error): void {
    if (process.env.NODE_ENV !== "production") {
      console.error("Aetherium World runtime failed", error);
    }
  }

  public override render(): React.ReactNode {
    if (this.state.error) {
      return (
        <WorldRuntimeFallback
          detail={this.state.error.message}
          message="World rendering failed during initialization. Your data is still available through Command Mode."
          title="World rendering failed"
        />
      );
    }

    return this.props.children;
  }
}

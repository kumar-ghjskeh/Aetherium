import Link from "next/link";
import React from "react";

export function WorldRuntimeFallback({
  detail,
  message,
  onRetry,
  title = "3D runtime unavailable"
}: Readonly<{
  detail?: string;
  message: string;
  onRetry?: () => void;
  title?: string;
}>): React.ReactElement {
  return (
    <section className="world-runtime-fallback" role="status">
      <div>
        <p className="eyebrow">Command Mode fallback</p>
        <h2>{title}</h2>
        <p>{message}</p>
        {detail ? <small>{detail}</small> : null}
      </div>
      <div className="world-runtime-actions">
        {onRetry ? (
          <button className="secondary-action" onClick={onRetry} type="button">
            Retry runtime check
          </button>
        ) : null}
        <Link className="primary-action" href="/app">
          Open Command Mode
        </Link>
      </div>
    </section>
  );
}

export function WorldRuntimeLoading(): React.ReactElement {
  return (
    <section className="world-runtime-loading" role="status">
      <span aria-hidden="true" />
      <div>
        <p className="eyebrow">World runtime</p>
        <h2>Loading diagnostic scene</h2>
        <p>Preparing the isolated visual bundle and capability checks.</p>
      </div>
    </section>
  );
}

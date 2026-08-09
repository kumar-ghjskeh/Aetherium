import React from "react";
import * as THREE from "three";

const FONT_SIZE_PX = 128;
const MAX_CANVAS_WIDTH = 2048;
const MAX_LINES = 4;
const TEXTURE_PADDING_PX = 48;

export interface WorldTextLabelProps {
  anchorX?: "center" | "left" | "right";
  anchorY?: "bottom" | "middle" | "top";
  children: React.ReactNode;
  color: string;
  fontSize: number;
  maxWidth: number;
  mirrorX?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  textAlign?: CanvasTextAlign;
}

export function flattenWorldLabelContent(content: React.ReactNode): string {
  if (typeof content === "string" || typeof content === "number") {
    return String(content);
  }
  if (Array.isArray(content)) {
    return content.map(flattenWorldLabelContent).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(content)) {
    return flattenWorldLabelContent(content.props.children);
  }
  return "";
}

export function normalizeWorldLabelText(content: React.ReactNode): string {
  return flattenWorldLabelContent(content).replace(/\s+/g, " ").trim();
}

export function wrapWorldLabelText(
  text: string,
  maxWidth: number,
  measure: (value: string) => number,
  maxLines = MAX_LINES
): string[] {
  if (!text) {
    return [];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const visible = lines.slice(0, maxLines);
  const remaining = lines.slice(maxLines - 1).join(" ");
  let truncated = remaining;
  while (truncated.length > 1 && measure(`${truncated}...`) > maxWidth) {
    truncated = truncated.slice(0, -1).trimEnd();
  }
  visible[maxLines - 1] = `${truncated}...`;
  return visible;
}

function nextPowerOfTwo(value: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(value, 1)));
}

function createLabelTexture(
  text: string,
  color: string,
  fontSize: number,
  maxWidth: number,
  textAlign: CanvasTextAlign
): { height: number; texture: THREE.CanvasTexture; width: number } | null {
  if (typeof document === "undefined" || !text) {
    return null;
  }

  const pixelsPerWorldUnit = FONT_SIZE_PX / Math.max(fontSize, 0.01);
  const maximumTextWidth = Math.min(
    maxWidth * pixelsPerWorldUnit,
    MAX_CANVAS_WIDTH - TEXTURE_PADDING_PX * 2
  );
  const measuringCanvas = document.createElement("canvas");
  const measuringContext = measuringCanvas.getContext("2d");
  if (!measuringContext) {
    return null;
  }
  measuringContext.font = `600 ${FONT_SIZE_PX}px Arial, sans-serif`;
  const lines = wrapWorldLabelText(
    text,
    maximumTextWidth,
    (value) => measuringContext.measureText(value).width
  );
  const measuredWidth = Math.max(
    ...lines.map((line) => measuringContext.measureText(line).width),
    FONT_SIZE_PX
  );
  const lineHeight = FONT_SIZE_PX * 1.2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(
    MAX_CANVAS_WIDTH,
    nextPowerOfTwo(Math.ceil(measuredWidth + TEXTURE_PADDING_PX * 2))
  );
  canvas.height = nextPowerOfTwo(Math.ceil(lines.length * lineHeight + TEXTURE_PADDING_PX * 2));

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.font = `600 ${FONT_SIZE_PX}px Arial, sans-serif`;
  context.textAlign = textAlign;
  context.textBaseline = "middle";
  const x =
    textAlign === "left"
      ? TEXTURE_PADDING_PX
      : textAlign === "right"
        ? canvas.width - TEXTURE_PADDING_PX
        : canvas.width / 2;
  const firstLineY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    context.fillText(line, x, firstLineY + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return {
    height: canvas.height / pixelsPerWorldUnit,
    texture,
    width: canvas.width / pixelsPerWorldUnit
  };
}

export function WorldTextLabel({
  children,
  color,
  fontSize,
  maxWidth,
  mirrorX = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  textAlign = "center"
}: Readonly<WorldTextLabelProps>): React.ReactElement | null {
  const text = normalizeWorldLabelText(children);
  const label = React.useMemo(
    () => createLabelTexture(text, color, fontSize, maxWidth, textAlign),
    [color, fontSize, maxWidth, text, textAlign]
  );

  React.useEffect(
    () => () => {
      label?.texture.dispose();
    },
    [label]
  );

  if (!label) {
    return null;
  }

  return (
    <mesh position={position} rotation={rotation} scale={[mirrorX ? -1 : 1, 1, 1]}>
      <planeGeometry args={[label.width, label.height]} />
      <meshBasicMaterial
        alphaTest={0.04}
        depthWrite={false}
        map={label.texture}
        polygonOffset
        polygonOffsetFactor={-1}
        side={THREE.DoubleSide}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

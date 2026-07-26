/**
 * Custom 2D-canvas draw functions for sigma labels/hover — the hover card is
 * tinted to the instrument-panel theme instead of sigma's stock styling.
 *
 * The label carries the node's TYPE GLYPH before its text. That glyph is the
 * second encoding channel: hue alone fails colour-vision-deficient readers.
 */

import type { Attributes } from "graphology-types";
import type { Settings } from "sigma/settings";
import type { NodeDisplayData, PartialButFor } from "sigma/types";
import { CANVAS, typeGlyph } from "./encoding";

type LabelData = PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color"> & {
  nodeType?: string;
};

const INK = CANVAS.ink;
const INK_STRONG = CANVAS.inkStrong;
const CARD_FILL = CANVAS.cardFill;
const GLYPH_GAP = 4;

/** "▲ label", or just "label" when the node has no type. */
function withGlyph(data: LabelData): string {
  const glyph = data.nodeType ? typeGlyph(data.nodeType) : "";
  return glyph ? `${glyph} ${data.label}` : String(data.label);
}

export function drawNodeLabel<N extends Attributes, E extends Attributes, G extends Attributes>(
  context: CanvasRenderingContext2D,
  data: LabelData,
  settings: Settings<N, E, G>,
): void {
  if (!data.label) return;
  const size = settings.labelSize;
  context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  context.fillStyle = INK;
  context.fillText(withGlyph(data), data.x + data.size + GLYPH_GAP + 1, data.y + size / 3);
}

export function drawNodeHover<N extends Attributes, E extends Attributes, G extends Attributes>(
  context: CanvasRenderingContext2D,
  data: LabelData,
  settings: Settings<N, E, G>,
): void {
  if (!data.label) return;
  const size = settings.labelSize;
  const text = withGlyph(data);
  context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  const width = context.measureText(text).width;
  const x = data.x + data.size + GLYPH_GAP + 1;
  const y = data.y;
  const padX = 6;
  const padY = 5;

  context.beginPath();
  context.fillStyle = CARD_FILL;
  context.strokeStyle = data.color ?? INK;
  context.lineWidth = 1;
  const rx = x - padX;
  const ry = y - size / 2 - padY;
  const rw = width + padX * 2;
  const rh = size + padY * 2;
  const r = 3;
  context.moveTo(rx + r, ry);
  context.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  context.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  context.arcTo(rx, ry + rh, rx, ry, r);
  context.arcTo(rx, ry, rx + rw, ry, r);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = INK_STRONG;
  context.fillText(text, x, y + size / 3);
}

/**
 * The hero graph proof — a 22-node / 31-edge KB rendered as DOM node overlays
 * over an SVG edge layer, mirroring the prototype's sigma+graphology overlay
 * technique (docs/handoff/landing-v2/README.md "3. Graph canvas" and
 * "4. Evidence panel"; prototype script lines 287-371). Selection drives an
 * amber halo, neighborhood dimming, label visibility ("lit" mode, fixed —
 * the prototype's `all`/`none` modes are exposed props there but not part of
 * this task's interface), and the evidence panel below.
 *
 * Accessibility (spec Deviation 3): every node is a real <button> — focusable,
 * Enter/Space selects via the native click event. The SVG edge layer is
 * aria-hidden (edges carry no independent information; the evidence panel is
 * the non-visual equivalent). The evidence panel is aria-live="polite" so a
 * screen reader announces the new selection.
 *
 * Mobile (spec Deviation 4): on a touch pointer, pointerdown selects but does
 * not start a drag — dragging an 11px target fails the 44px hit-target rule.
 */
import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ConfidenceBar } from "./ds/ConfidenceBar";
import { TypeChip } from "./ds/TypeChip";
import { FINDINGS, NODES, TYPE_COLORS, VIEW } from "./graphData";
import { degrees, diameter, isLit, neighborsOf, visible, type Density } from "./kbGraphModel";

export interface KbGraphProps {
  density?: Density;
}

interface Pos {
  x: number;
  y: number;
}

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

export function KbGraph({ density = "full" }: KbGraphProps): JSX.Element {
  const [sel, setSel] = useState<string | null>("c_finding");
  const [hover, setHover] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, Pos>>({});
  const [drag, setDrag] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Window-level pointerup is what stops a node sticking to the cursor when
  // the pointer is released outside the canvas (prototype lines 291-294).
  useEffect(() => {
    const onWindowPointerUp = () => setDrag(null);
    window.addEventListener("pointerup", onWindowPointerUp);
    return () => window.removeEventListener("pointerup", onWindowPointerUp);
  }, []);

  const { ns, es } = visible(density);
  const deg = degrees(es);
  const neighbors = neighborsOf(sel, es);
  const lit = (id: string) => isLit(id, sel, neighbors);

  const at = (n: { id: string; x: number; y: number }): Pos => pos[n.id] || { x: n.x, y: n.y };

  const onMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const id = drag;
    const el = canvasRef.current;
    if (!id || !el) return;
    const r = el.getBoundingClientRect();
    setPos((p) => ({
      ...p,
      [id]: {
        x: VIEW.x + ((ev.clientX - r.left) / r.width) * VIEW.w,
        y: VIEW.y + ((ev.clientY - r.top) / r.height) * VIEW.h,
      },
    }));
  };

  const onUp = () => setDrag(null);

  const onNodeDown = (id: string) => (ev: ReactPointerEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    setSel(id);
    if (ev.pointerType !== "touch") setDrag(id);
  };

  const selNode = NODE_BY_ID.get(sel ?? "") ?? NODES[1]!;
  const selFindings = selNode.grounded.map((k) => ({ key: k, ...FINDINGS[k]! }));

  return (
    <section className="lpv2-graph-section">
      <div className="lpv2-graph">
        <div
          ref={canvasRef}
          className="lpv2-graph-canvas"
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          <svg
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            preserveAspectRatio="none"
            className="lpv2-graph-edges"
            aria-hidden="true"
          >
            {es.map((e) => {
              const source = NODE_BY_ID.get(e.source);
              const target = NODE_BY_ID.get(e.target);
              if (!source || !target) return null;
              const a = at(source);
              const b = at(target);
              const edgeLit = lit(e.source) && lit(e.target);
              return (
                <line
                  key={e.id}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: edgeLit ? "var(--dlpv2-graph-edge-lit)" : "var(--dlpv2-graph-edge-dim)" }}
                />
              );
            })}
          </svg>
          {ns.map((n) => {
            const p = at(n);
            const isSel = n.id === sel;
            const isNodeLit = lit(n.id);
            const d = diameter(deg[n.id] || 0);
            const showLabel = isNodeLit || hover === n.id;
            return (
              <button
                key={n.id}
                type="button"
                className="lpv2-graph-node"
                aria-label={n.label}
                aria-pressed={isSel}
                onPointerDown={onNodeDown(n.id)}
                onClick={() => setSel(n.id)}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                style={{
                  left: `${((p.x - VIEW.x) / VIEW.w) * 100}%`,
                  top: `${((p.y - VIEW.y) / VIEW.h) * 100}%`,
                  zIndex: isSel ? 14 : 10,
                  opacity: isNodeLit ? 1 : 0.16,
                  transition:
                    drag === n.id
                      ? "none"
                      : "left 420ms cubic-bezier(.2,.9,.3,1), top 420ms cubic-bezier(.2,.9,.3,1), opacity 320ms ease",
                }}
              >
                <span
                  className="lpv2-graph-node-dot"
                  aria-hidden="true"
                  style={{
                    width: d,
                    height: d,
                    background: TYPE_COLORS[n.type],
                    boxShadow: isSel ? "var(--dlpv2-graph-node-halo)" : "var(--dlpv2-graph-node-shadow)",
                  }}
                />
                {showLabel && (
                  <span
                    className="lpv2-graph-node-label"
                    aria-hidden="true"
                    style={{
                      top: d + 6,
                      color: isSel ? "var(--dlpv2-text)" : "var(--dlpv2-text-faint)",
                      fontWeight: isSel ? 500 : 400,
                    }}
                  >
                    {n.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="lpv2-graph-caption">
          {sel ? "22 nodes · 31 edges · drag any node" : "22 nodes · 31 edges · select a node"}
        </div>
        <div className="lpv2-graph-evidence" aria-live="polite">
          <div className="lpv2-graph-evidence-header">
            <TypeChip type={selNode.type} />
            <span className="lpv2-graph-evidence-label">{selNode.label}</span>
            <span className="lpv2-graph-evidence-aux">
              grounded in {selFindings.length} {selFindings.length === 1 ? "finding" : "findings"}
            </span>
          </div>
          <div className="lpv2-graph-evidence-grid">
            {selFindings.map((f) => (
              <div key={f.key} className="lpv2-graph-finding">
                <p className="lpv2-graph-finding-title">{f.title}</p>
                <div className="lpv2-graph-finding-meta">
                  <span className="lpv2-graph-finding-category">{f.category}</span>
                  <ConfidenceBar value={f.confidence} width={54} />
                  <span className="lpv2-graph-finding-prov">{f.prov}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

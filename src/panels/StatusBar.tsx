/**
 * Bottom status bar: connection state, last action, undo/redo controls.
 */

import { useStore } from "../state/store";

export function StatusBar() {
  const readOnly = useStore((s) => s.readOnly);
  const lastAction = useStore((s) => s.lastAction);
  const canUndo = useStore((s) => s.canUndo);
  const canRedo = useStore((s) => s.canRedo);
  const undoLabel = useStore((s) => s.undoLabel);
  const redoLabel = useStore((s) => s.redoLabel);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  return (
    <footer className="sb">
      <span className="sb-conn">
        <span className={`sb-dot${readOnly ? " sb-dot--down" : ""}`} />
        {readOnly ? "engine unreachable" : "live api"}
      </span>
      <span className="sb-action">
        last: <b>{lastAction}</b>
      </span>
      <span className="sb-history">
        <button
          className="btn"
          disabled={!canUndo}
          onClick={() => void undo()}
          title={undoLabel ? `undo: ${undoLabel} (⌘Z)` : "nothing to undo"}
        >
          ⤺ undo
        </button>
        <button
          className="btn"
          disabled={!canRedo}
          onClick={() => void redo()}
          title={redoLabel ? `redo: ${redoLabel} (⌘⇧Z)` : "nothing to redo"}
        >
          ⤻ redo
        </button>
      </span>
    </footer>
  );
}

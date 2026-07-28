/** React's view of engineStatus. The status module itself stays React-free so it
 *  can be unit-tested in the node environment. */
import { useEffect, useState } from "react";
import {
  getEngineState,
  onEngineStateChange,
  probeEngine,
  startEngineWatch,
  type EngineState,
} from "../api/engineStatus";

export function useEngineState(): EngineState {
  const [state, setState] = useState<EngineState>(getEngineState);

  useEffect(() => {
    const off = onEngineStateChange(setState);
    const stopWatch = startEngineWatch();
    void probeEngine();
    return () => {
      off();
      stopWatch();
    };
  }, []);

  return state;
}

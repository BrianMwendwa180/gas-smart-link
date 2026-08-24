import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CONFIG, createBaseMap } from "./defaults";
import type { EcuConfig, FuelMode, LinkStatus, PacketFrame, Telemetry } from "./types";

interface EcuContextValue {
  status: LinkStatus;
  connect: () => void;
  disconnect: () => void;
  telemetry: Telemetry;
  history: Telemetry[];
  frames: PacketFrame[];
  mode: FuelMode;
  requestMode: (mode: "petrol" | "gas") => void;
  config: EcuConfig;
  setConfig: (patch: Partial<EcuConfig>) => void;
  fuelMap: number[][];
  setCell: (r: number, c: number, value: number) => void;
  scaleMap: (delta: number) => void;
  resetMap: () => void;
  dirty: boolean;
  writeToEcu: () => void;
  recording: boolean;
  toggleRecording: () => void;
  log: Telemetry[];
  clearLog: () => void;
}

const EcuContext = createContext<EcuContextValue | null>(null);

const IDLE: Telemetry = {
  t: 0,
  rpm: 0,
  map: 0.32,
  gasPressure: 0,
  gasTemp: 21,
  reducerTemp: 21,
  petrolPulse: 0,
  gasPulse: 0,
  lambda: 1,
  batteryVoltage: 12.4,
  tankLevel: 68,
  mode: "petrol",
};

const HEX = "0123456789ABCDEF";
function randHex(bytes: number) {
  let out = "";
  for (let i = 0; i < bytes; i++) {
    out += HEX[Math.floor(Math.random() * 16)] + HEX[Math.floor(Math.random() * 16)] + " ";
  }
  return out.trim();
}

export function EcuProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LinkStatus>("disconnected");
  const [telemetry, setTelemetry] = useState<Telemetry>(IDLE);
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [frames, setFrames] = useState<PacketFrame[]>([]);
  const [mode, setMode] = useState<FuelMode>("petrol");
  const [config, setConfigState] = useState<EcuConfig>(DEFAULT_CONFIG);
  const [fuelMap, setFuelMap] = useState<number[][]>(() => createBaseMap());
  const [dirty, setDirty] = useState(false);
  const [recording, setRecording] = useState(false);
  const [log, setLog] = useState<Telemetry[]>([]);

  const tick = useRef(0);
  const phase = useRef(0);
  const frameId = useRef(0);
  const pending = useRef<FuelMode>("petrol");

  const connect = useCallback(() => {
    setStatus("connecting");
    setTimeout(() => setStatus("connected"), 900);
  }, []);

  const disconnect = useCallback(() => {
    setStatus("disconnected");
    setTelemetry(IDLE);
    setMode("petrol");
    pending.current = "petrol";
    setRecording(false);
  }, []);

  const requestMode = useCallback((next: "petrol" | "gas") => {
    pending.current = next;
    setMode("transition");
    setTimeout(() => setMode(next), 1400);
  }, []);

  useEffect(() => {
    if (status !== "connected") return;
    const id = setInterval(() => {
      tick.current += 1;
      phase.current += 0.12;
      const p = phase.current;
      const rpm = Math.round(1500 + Math.sin(p / 2.4) * 900 + Math.sin(p * 1.7) * 180 + 400);
      const load = 1.1 + (rpm / 6200) * 4.4 + Math.sin(p / 3) * 0.25;
      const petrolPulse = Math.round((1.8 + load * 0.9) * 100) / 100;
      const onGas = mode === "gas";
      const warm = Math.min(78, 21 + tick.current * 0.8);

      const next: Telemetry = {
        t: Date.now(),
        rpm,
        map: Math.round(load * 100) / 100,
        gasPressure: onGas ? Math.round((1.32 - load * 0.02 + Math.sin(p) * 0.01) * 100) / 100 : 0,
        gasTemp: Math.round(warm * 0.62 + 8),
        reducerTemp: Math.round(warm),
        petrolPulse: onGas ? 0 : petrolPulse,
        gasPulse: onGas ? Math.round(petrolPulse * 1.29 * 100) / 100 : 0,
        lambda: Math.round((1 + Math.sin(p * 2.1) * 0.06) * 1000) / 1000,
        batteryVoltage: Math.round((14.1 + Math.sin(p / 5) * 0.15) * 10) / 10,
        tankLevel: Math.max(4, 68 - tick.current * 0.01),
        mode,
      };

      setTelemetry(next);
      setHistory((h) => [...h.slice(-119), next]);
      setRecording((rec) => {
        if (rec) setLog((l) => [...l.slice(-999), next]);
        return rec;
      });

      frameId.current += 1;
      const fid = frameId.current;
      setFrames((f) =>
        [
          {
            id: fid * 2,
            direction: "tx" as const,
            ts: new Date().toLocaleTimeString(),
            cmd: "REQ_LIVE_DATA",
            hex: `AA 55 21 ${randHex(3)} 0D`,
          },
          {
            id: fid * 2 + 1,
            direction: "rx" as const,
            ts: new Date().toLocaleTimeString(),
            cmd: "LIVE_DATA_FRAME",
            hex: `AA 55 A1 ${randHex(8)} 0D`,
          },
          ...f,
        ].slice(0, 60),
      );
    }, 700);
    return () => clearInterval(id);
  }, [status, mode]);

  const setConfig = useCallback((patch: Partial<EcuConfig>) => {
    setConfigState((c) => ({ ...c, ...patch }));
    setDirty(true);
  }, []);

  const setCell = useCallback((r: number, c: number, value: number) => {
    setFuelMap((m) => m.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? value : v)) : row)));
    setDirty(true);
  }, []);

  const scaleMap = useCallback((delta: number) => {
    setFuelMap((m) => m.map((row) => row.map((v) => Math.round((v + delta) * 1000) / 1000)));
    setDirty(true);
  }, []);

  const resetMap = useCallback(() => {
    setFuelMap(createBaseMap());
    setDirty(true);
  }, []);

  const writeToEcu = useCallback(() => setDirty(false), []);
  const toggleRecording = useCallback(() => setRecording((r) => !r), []);
  const clearLog = useCallback(() => setLog([]), []);

  const value = useMemo<EcuContextValue>(
    () => ({
      status,
      connect,
      disconnect,
      telemetry,
      history,
      frames,
      mode,
      requestMode,
      config,
      setConfig,
      fuelMap,
      setCell,
      scaleMap,
      resetMap,
      dirty,
      writeToEcu,
      recording,
      toggleRecording,
      log,
      clearLog,
    }),
    [
      status,
      connect,
      disconnect,
      telemetry,
      history,
      frames,
      mode,
      requestMode,
      config,
      setConfig,
      fuelMap,
      setCell,
      scaleMap,
      resetMap,
      dirty,
      writeToEcu,
      recording,
      toggleRecording,
      log,
      clearLog,
    ],
  );

  return <EcuContext.Provider value={value}>{children}</EcuContext.Provider>;
}

export function useEcu() {
  const ctx = useContext(EcuContext);
  if (!ctx) throw new Error("useEcu must be used inside EcuProvider");
  return ctx;
}

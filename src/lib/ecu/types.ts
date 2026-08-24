export type FuelMode = "petrol" | "gas" | "transition";

export type LinkProtocol = "usb-serial" | "k-line" | "can-bus" | "bluetooth";

export type LinkStatus = "disconnected" | "connecting" | "connected" | "error";

export interface Telemetry {
  t: number;
  rpm: number;
  map: number; // manifold absolute pressure, bar
  gasPressure: number; // bar
  gasTemp: number; // deg C
  reducerTemp: number; // deg C
  petrolPulse: number; // ms
  gasPulse: number; // ms
  lambda: number;
  batteryVoltage: number;
  tankLevel: number; // 0..100 %
  mode: FuelMode;
}

export interface EcuConfig {
  cylinders: number;
  injectorType: string;
  switchRpm: number;
  switchTemp: number;
  switchDelay: number; // s
  minGasPressure: number; // bar
  maxRpmCutoff: number;
  sequentialSwitch: boolean;
  autoReturnPetrol: boolean;
  lambdaCorrection: boolean;
  obdAdaptation: boolean;
  protocol: LinkProtocol;
  baudRate: number;
  port: string;
}

export interface Dtc {
  code: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  occurrences: number;
  lastSeen: string;
}

export interface PacketFrame {
  id: number;
  direction: "tx" | "rx";
  ts: string;
  cmd: string;
  hex: string;
}

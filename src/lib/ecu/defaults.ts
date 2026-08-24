import type { Dtc, EcuConfig } from "./types";

export const DEFAULT_CONFIG: EcuConfig = {
  cylinders: 4,
  injectorType: "Valtek Type-30 (2 Ohm)",
  switchRpm: 1450,
  switchTemp: 34,
  switchDelay: 6,
  minGasPressure: 0.95,
  maxRpmCutoff: 6200,
  sequentialSwitch: true,
  autoReturnPetrol: true,
  lambdaCorrection: true,
  obdAdaptation: false,
  protocol: "usb-serial",
  baudRate: 115200,
  port: "COM4",
};

export const RPM_AXIS = [800, 1400, 2000, 2600, 3200, 3800, 4400, 5200];
export const LOAD_AXIS = [1.2, 1.6, 2.0, 2.6, 3.2, 4.0, 5.0, 6.2];

/** Multiplier map: gas pulse = petrol pulse * k(rpm, load) */
export function createBaseMap(): number[][] {
  return LOAD_AXIS.map((load, r) =>
    RPM_AXIS.map((rpm, c) => {
      const base = 1.24 + c * 0.021 + r * 0.014 - (load > 4 ? 0.03 : 0);
      return Math.round((base + Math.sin((rpm + load) / 900) * 0.012) * 1000) / 1000;
    }),
  );
}

export const DTCS: Dtc[] = [
  {
    code: "P0301",
    title: "Gas pressure below threshold",
    detail: "Reducer outlet pressure dropped under 0.95 bar during high load. Verify filter and reducer diaphragm.",
    severity: "critical",
    occurrences: 3,
    lastSeen: "2026-08-22 14:02",
  },
  {
    code: "P0117",
    title: "Reducer temperature sensor — low signal",
    detail: "Short to ground detected on the temperature sensor circuit for over 2 s.",
    severity: "warning",
    occurrences: 1,
    lastSeen: "2026-08-19 09:41",
  },
  {
    code: "P0263",
    title: "Cylinder 2 gas injector — long pulse",
    detail: "Injector opening time exceeded map limit by 18%. Check nozzle diameter and injector coil.",
    severity: "warning",
    occurrences: 7,
    lastSeen: "2026-08-24 07:15",
  },
  {
    code: "U0100",
    title: "OBD adapter link intermittent",
    detail: "Lost CAN frames from the engine ECU. Adaptation paused while the link was down.",
    severity: "info",
    occurrences: 2,
    lastSeen: "2026-08-11 17:26",
  },
];

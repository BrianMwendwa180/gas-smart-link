import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge } from "@/components/ecu/Gauge";
import { StatTile } from "@/components/ecu/StatTile";
import { useEcu } from "@/lib/ecu/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Dashboard — GoFast LPG/CNG ECU Suite" },
      {
        name: "description",
        content:
          "Real-time LPG/CNG ECU dashboard: RPM, manifold and gas pressure, reducer temperature, injector pulse widths and lambda.",
      },
      { property: "og:title", content: "Live Dashboard — GoFast LPG/CNG ECU Suite" },
      {
        property: "og:description",
        content: "Monitor gas pressure, injector timing and fuel switching from a single console.",
      },
    ],
  }),
  component: Dashboard,
});

const chartStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontSize: 12,
  },
  labelStyle: { color: "var(--muted-foreground)" },
};

function Dashboard() {
  const { telemetry: t, history, status, mode, config } = useEcu();
  const offline = status !== "connected";
  const data = history.map((h, i) => ({ i, ...h }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {offline
              ? "Connect the USB interface to begin streaming live parameters."
              : `Streaming at 1.4 Hz over ${config.protocol.toUpperCase()} · ${config.cylinders} cylinders`}
          </p>
        </div>
        <div
          className={`rounded-md border px-3 py-1.5 readout text-xs ${
            mode === "gas"
              ? "border-gas/40 bg-gas/10 text-gas"
              : mode === "transition"
                ? "border-warn/40 bg-warn/10 text-warn"
                : "border-petrol/40 bg-petrol/10 text-petrol"
          }`}
        >
          FUEL: {mode.toUpperCase()}
        </div>
      </div>

      <div className="panel hatch grid grid-cols-2 gap-4 p-5 lg:grid-cols-4">
        <Gauge label="Engine speed" value={t.rpm} max={7000} unit="rpm" tone="info" />
        <Gauge label="Manifold pressure" value={t.map} max={7} unit="bar" decimals={2} tone="info" />
        <Gauge label="Gas pressure" value={t.gasPressure} max={2.5} unit="bar" decimals={2} tone="gas" />
        <Gauge label="Reducer temp" value={t.reducerTemp} max={120} unit="°C" tone="warn" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Petrol pulse" value={t.petrolPulse.toFixed(2)} unit="ms" tone="petrol" />
        <StatTile label="Gas pulse" value={t.gasPulse.toFixed(2)} unit="ms" tone="gas" />
        <StatTile
          label="Lambda"
          value={t.lambda.toFixed(3)}
          hint={t.lambda > 1 ? "Lean side of stoich" : "Rich side of stoich"}
        />
        <StatTile label="Gas temperature" value={`${t.gasTemp}`} unit="°C" />
        <StatTile label="Battery" value={t.batteryVoltage.toFixed(1)} unit="V" />
        <StatTile label="Tank level" value={t.tankLevel.toFixed(0)} unit="%" tone="gas" />
        <StatTile
          label="Switch threshold"
          value={`${config.switchRpm}`}
          unit="rpm"
          hint={`Reducer ≥ ${config.switchTemp} °C`}
        />
        <StatTile
          label="Min gas pressure"
          value={config.minGasPressure.toFixed(2)}
          unit="bar"
          tone={t.gasPressure > 0 && t.gasPressure < config.minGasPressure ? "destructive" : "default"}
          hint="Auto-return to petrol below limit"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <p className="label-caps mb-3">Engine speed / manifold pressure</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" />
              <XAxis dataKey="i" hide />
              <YAxis yAxisId="l" stroke="var(--muted-foreground)" fontSize={11} width={44} />
              <YAxis yAxisId="r" orientation="right" stroke="var(--muted-foreground)" fontSize={11} width={34} />
              <Tooltip {...chartStyle} />
              <Area
                yAxisId="l"
                type="monotone"
                dataKey="rpm"
                stroke="var(--info)"
                fill="var(--info)"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
              <Line yAxisId="r" type="monotone" dataKey="map" stroke="var(--warn)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-4">
          <p className="label-caps mb-3">Injector opening times</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" />
              <XAxis dataKey="i" hide />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} width={44} />
              <Tooltip {...chartStyle} />
              <Line type="monotone" dataKey="gasPulse" stroke="var(--gas)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="petrolPulse" stroke="var(--petrol)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOAD_AXIS, RPM_AXIS } from "@/lib/ecu/defaults";
import { useEcu } from "@/lib/ecu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maps")({
  head: () => ({
    meta: [
      { title: "Calibration Map Editor — GoFast LPG/CNG Suite" },
      {
        name: "description",
        content:
          "Edit the gas injector multiplier map across RPM and manifold load, with live cursor tracking and bulk trims.",
      },
      { property: "og:title", content: "Calibration Map Editor — GoFast LPG/CNG Suite" },
      {
        property: "og:description",
        content: "Tune the petrol-to-gas pulse multiplier per RPM and load cell.",
      },
    ],
  }),
  component: MapEditor,
});

function heat(v: number, min: number, max: number) {
  const p = max === min ? 0.5 : (v - min) / (max - min);
  return `color-mix(in oklch, var(--gas) ${Math.round(p * 62 + 6)}%, var(--panel))`;
}

function MapEditor() {
  const { fuelMap, setCell, scaleMap, resetMap, telemetry, status, writeToEcu, dirty } = useEcu();
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);

  const flat = fuelMap.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  const liveC =
    status === "connected"
      ? RPM_AXIS.reduce((best, v, i) => (Math.abs(v - telemetry.rpm) < Math.abs((RPM_AXIS[best] ?? 0) - telemetry.rpm) ? i : best), 0)
      : -1;
  const liveR =
    status === "connected"
      ? LOAD_AXIS.reduce((best, v, i) => (Math.abs(v - telemetry.map) < Math.abs((LOAD_AXIS[best] ?? 0) - telemetry.map) ? i : best), 0)
      : -1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calibration map editor</h1>
          <p className="text-sm text-muted-foreground">
            Gas injector multiplier — gas pulse = petrol pulse × K(rpm, load).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => scaleMap(-0.01)}>
            <Minus className="size-4" /> Trim 1%
          </Button>
          <Button variant="outline" size="sm" onClick={() => scaleMap(0.01)}>
            <Plus className="size-4" /> Enrich 1%
          </Button>
          <Button variant="outline" size="sm" onClick={resetMap}>
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              writeToEcu();
              toast.success("Map uploaded to ECU");
            }}
          >
            <Upload className="size-4" /> Upload map
          </Button>
        </div>
      </div>

      <div className="panel overflow-x-auto p-4">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="label-caps w-20 text-left">bar \ rpm</th>
              {RPM_AXIS.map((r) => (
                <th key={r} className={cn("label-caps px-1", liveC === RPM_AXIS.indexOf(r) && "text-gas")}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuelMap.map((row, r) => (
              <tr key={r}>
                <td className={cn("label-caps", liveR === r && "text-gas")}>{LOAD_AXIS[r]?.toFixed(1)}</td>
                {row.map((v, c) => {
                  const isLive = liveR === r && liveC === c;
                  const isSel = sel?.r === r && sel?.c === c;
                  return (
                    <td key={c}>
                      <button
                        onClick={() => setSel({ r, c })}
                        style={{ background: heat(v, min, max) }}
                        className={cn(
                          "readout w-full rounded-sm border px-2 py-2 text-xs transition-all",
                          isSel ? "border-gas ring-1 ring-gas" : "border-transparent",
                          isLive && "outline outline-2 outline-offset-1 outline-warn",
                        )}
                      >
                        {v.toFixed(3)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel space-y-3 p-4 lg:col-span-1">
          <p className="label-caps">Selected cell</p>
          {sel ? (
            <>
              <p className="readout text-sm text-muted-foreground">
                {RPM_AXIS[sel.c]} rpm · {LOAD_AXIS[sel.r]?.toFixed(1)} bar
              </p>
              <Input
                type="number"
                step="0.001"
                value={fuelMap[sel.r]?.[sel.c] ?? 0}
                onChange={(e) => setCell(sel.r, sel.c, Number(e.target.value))}
                className="readout"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCell(sel.r, sel.c, Math.round(((fuelMap[sel.r]?.[sel.c] ?? 0) - 0.005) * 1000) / 1000)
                  }
                >
                  −0.005
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCell(sel.r, sel.c, Math.round(((fuelMap[sel.r]?.[sel.c] ?? 0) + 0.005) * 1000) / 1000)
                  }
                >
                  +0.005
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a cell in the grid to edit it.</p>
          )}
        </div>

        <div className="panel space-y-2 p-4 lg:col-span-2">
          <p className="label-caps">Live operating point</p>
          {status === "connected" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="label-caps">RPM</p>
                <p className="readout text-lg">{telemetry.rpm}</p>
              </div>
              <div>
                <p className="label-caps">Load</p>
                <p className="readout text-lg">{telemetry.map.toFixed(2)} bar</p>
              </div>
              <div>
                <p className="label-caps">Active K</p>
                <p className="readout text-lg text-gas">
                  {(fuelMap[Math.max(liveR, 0)]?.[Math.max(liveC, 0)] ?? 0).toFixed(3)}
                </p>
              </div>
              <div>
                <p className="label-caps">Lambda</p>
                <p className="readout text-lg">{telemetry.lambda.toFixed(3)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect the ECU to track the live cell inside the map.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

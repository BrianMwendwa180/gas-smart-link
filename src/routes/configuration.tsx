import { createFileRoute } from "@tanstack/react-router";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEcu } from "@/lib/ecu/store";
import { DEFAULT_CONFIG } from "@/lib/ecu/defaults";
import type { LinkProtocol } from "@/lib/ecu/types";

export const Route = createFileRoute("/configuration")({
  head: () => ({
    meta: [
      { title: "ECU Configuration — GoFast LPG/CNG Suite" },
      {
        name: "description",
        content:
          "Configure cylinders, injector type, switching thresholds, pressure limits and the USB/CAN/K-Line device link.",
      },
      { property: "og:title", content: "ECU Configuration — GoFast LPG/CNG Suite" },
      {
        property: "og:description",
        content: "Set switching thresholds, safety limits and the interface protocol for your gas ECU.",
      },
    ],
  }),
  component: Configuration,
});

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{note}</p>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="readout text-sm text-gas">
          {value} <span className="text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? min)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border pt-4 first:border-0 first:pt-0">
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Configuration() {
  const { config, setConfig, writeToEcu, dirty } = useEcu();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">ECU configuration</h1>
          <p className="text-sm text-muted-foreground">
            Installation parameters, switching strategy and device link settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setConfig(DEFAULT_CONFIG);
              toast("Configuration reset to installer defaults");
            }}
          >
            <RotateCcw className="size-4" /> Defaults
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              writeToEcu();
              toast.success("Configuration written to ECU flash");
            }}
          >
            <Save className="size-4" /> Write to ECU
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Installation" note="Hardware layout of the gas system.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Cylinders</Label>
              <Select
                value={String(config.cylinders)}
                onValueChange={(v) => setConfig({ cylinders: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} cylinders
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Injector rail</Label>
              <Select
                value={config.injectorType}
                onValueChange={(v) => setConfig({ injectorType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Valtek Type-30 (2 Ohm)",
                    "Valtek Type-34 (3 Ohm)",
                    "Hana H2001 (2 Ohm)",
                    "Matrix HD-344",
                    "Barracuda (1.9 Ohm)",
                  ].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SliderRow
            label="RPM cut-off"
            value={config.maxRpmCutoff}
            min={4000}
            max={8000}
            step={100}
            unit="rpm"
            onChange={(v) => setConfig({ maxRpmCutoff: v })}
          />
        </Section>

        <Section title="Switching strategy" note="Conditions for changing over from petrol to gas.">
          <SliderRow
            label="Switch-over RPM"
            value={config.switchRpm}
            min={900}
            max={3000}
            step={50}
            unit="rpm"
            onChange={(v) => setConfig({ switchRpm: v })}
          />
          <SliderRow
            label="Reducer temperature"
            value={config.switchTemp}
            min={10}
            max={70}
            unit="°C"
            onChange={(v) => setConfig({ switchTemp: v })}
          />
          <SliderRow
            label="Switch delay after start"
            value={config.switchDelay}
            min={0}
            max={60}
            unit="s"
            onChange={(v) => setConfig({ switchDelay: v })}
          />
          <SliderRow
            label="Minimum gas pressure"
            value={config.minGasPressure}
            min={0.4}
            max={2}
            step={0.05}
            unit="bar"
            onChange={(v) => setConfig({ minGasPressure: Math.round(v * 100) / 100 })}
          />
        </Section>

        <Section title="Behaviour" note="Runtime strategies and corrections.">
          <ToggleRow
            label="Sequential cylinder switching"
            note="Change cylinders over one by one instead of all at once."
            checked={config.sequentialSwitch}
            onChange={(v) => setConfig({ sequentialSwitch: v })}
          />
          <ToggleRow
            label="Auto-return to petrol"
            note="Fall back to petrol on low pressure or empty tank."
            checked={config.autoReturnPetrol}
            onChange={(v) => setConfig({ autoReturnPetrol: v })}
          />
          <ToggleRow
            label="Lambda correction"
            note="Trim gas pulse width using the O₂ sensor signal."
            checked={config.lambdaCorrection}
            onChange={(v) => setConfig({ lambdaCorrection: v })}
          />
          <ToggleRow
            label="OBD adaptation"
            note="Read fuel trims over OBD and self-tune the multiplier map."
            checked={config.obdAdaptation}
            onChange={(v) => setConfig({ obdAdaptation: v })}
          />
        </Section>

        <Section title="Device link" note="USB ↔ ECU interface used by the packet layer.">
          <div className="space-y-2">
            <Label className="text-xs">Protocol</Label>
            <Select
              value={config.protocol}
              onValueChange={(v) => setConfig({ protocol: v as LinkProtocol })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usb-serial">USB serial (FTDI / CH340)</SelectItem>
                <SelectItem value="k-line">K-Line (ISO 9141)</SelectItem>
                <SelectItem value="can-bus">CAN bus (11-bit)</SelectItem>
                <SelectItem value="bluetooth">Bluetooth SPP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Port</Label>
              <Input value={config.port} onChange={(e) => setConfig({ port: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Baud rate</Label>
              <Select
                value={String(config.baudRate)}
                onValueChange={(v) => setConfig({ baudRate: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[9600, 19200, 38400, 57600, 115200, 230400].map((b) => (
                    <SelectItem key={b} value={String(b)}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="rounded-md border border-border bg-panel-raised px-3 py-2 text-xs text-muted-foreground">
            This console speaks an open, documented frame format. It does not decrypt or
            redistribute proprietary vendor firmware.
          </p>
        </Section>
      </div>
    </div>
  );
}

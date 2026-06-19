import { getTranslations } from "next-intl/server";

interface FlowStep {
  name: string;
  note: string;
  highlight?: boolean;
}

interface Flow {
  label: string;
  steps: FlowStep[];
}

export default async function UserFlows() {
  const t = await getTranslations("architecture");
  const consumer = t.raw("consumerFlow") as Flow;
  const clinic = t.raw("clinicFlow") as Flow;
  return (
    <section className="bg-dr-off py-12 px-8 md:px-14">
      <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-dr-mid mb-4">
        {t("flowLabel")}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FlowCard flow={consumer} accent="red" />
        <FlowCard flow={clinic} accent="grey" />
      </div>
    </section>
  );
}

function FlowCard({ flow, accent }: { flow: Flow; accent: "red" | "grey" }) {
  const labelColor =
    accent === "red" ? "text-dr-red" : "text-[#888]";
  return (
    <div className="bg-dr-white border border-dr-border p-6">
      <div
        className={`text-[10px] font-semibold tracking-[0.2em] uppercase ${labelColor} mb-4`}
      >
        {flow.label}
      </div>
      <div className="flex flex-col items-start gap-2">
        {flow.steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-center gap-3">
              <div
                className={`min-w-[160px] py-1.5 px-3 text-[11px] text-center border ${
                  step.highlight
                    ? "bg-dr-red text-white border-dr-red"
                    : "bg-dr-off text-dr-ink border-dr-border"
                }`}
              >
                {step.name}
              </div>
              <span className="text-[10px] text-dr-mid">{step.note}</span>
            </div>
            {i < flow.steps.length - 1 && (
              <div className="pl-3 text-[16px] text-[rgba(200,16,46,0.3)]">
                ↓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

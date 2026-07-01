import { getTranslations } from "next-intl/server";
import ClinicShell from "@/components/layout/ClinicShell";
import { CLINIC_SETTINGS } from "@/config/clinic-portal-mock";

// Clinic Settings (spec §13): profile, team, machines, notifications.
// Team access is role-scoped: Lead Dermatologist / Doctor / Receptionist / Admin.
export default async function ClinicSettingsPage() {
  const t = await getTranslations("clinic");

  return (
    <ClinicShell
      pageTitle={t("settings.pageTitle")}
      pageSub={t("settings.pageSub")}
    >
      <div>
        <div className="mb-5">
          <h1 className="font-serif text-[28px] md:text-[32px] font-light text-dr-ink leading-[1.2] mb-1.5">
            {t.rich("settings.title", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="text-[12px] text-dr-mid leading-[1.7] max-w-[640px]">
            {t("settings.sub")}
          </p>
        </div>

        {/* Clinic profile */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.profileHeading")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Clinic name" value={CLINIC_SETTINGS.profile.name} />
            <Field label="Phone" value={CLINIC_SETTINGS.profile.phone} />
            <Field label="Address" value={CLINIC_SETTINGS.profile.address} />
            <Field label="Hours" value={CLINIC_SETTINGS.profile.hours} />
            <Field
              label="Specialties"
              value={CLINIC_SETTINGS.profile.specialties.join(" · ")}
            />
          </div>
        </div>

        {/* Team */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.teamHeading")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("settings.colMember")}</Th>
                  <Th>{t("settings.colRole")}</Th>
                  <Th>{t("settings.colEmail")}</Th>
                </tr>
              </thead>
              <tbody>
                {CLINIC_SETTINGS.team.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <span className="font-medium text-dr-ink">{m.name}</span>
                    </Td>
                    <Td>{m.role}</Td>
                    <Td>{m.email}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machines */}
        <div className="bg-dr-white border border-dr-border p-5 mb-4">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.machinesHeading")}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>{t("settings.colMachine")}</Th>
                  <Th>{t("settings.colPurchased")}</Th>
                  <Th>{t("settings.colLastService")}</Th>
                </tr>
              </thead>
              <tbody>
                {CLINIC_SETTINGS.machines.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <span className="font-medium text-dr-ink">{m.name}</span>
                    </Td>
                    <Td>{m.purchased}</Td>
                    <Td>{m.lastService}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-dr-white border border-dr-border p-5">
          <div className="text-[9px] font-semibold tracking-[0.2em] uppercase text-dr-red mb-3.5 flex items-center gap-2">
            <span className="block w-2.5 h-px bg-dr-red" />
            {t("settings.notificationsHeading")}
          </div>
          <div className="flex flex-col gap-3">
            <NotificationRow label={t("settings.notifyReferrals")} />
            <NotificationRow label={t("settings.notifyReports")} />
            <NotificationRow label={t("settings.notifyAppointments")} />
          </div>
          <div className="text-[9px] text-dr-mid mt-3 pt-3 border-t border-dr-border">
            {t("settings.notifyChannels")}
          </div>
        </div>
      </div>
    </ClinicShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8px] font-semibold tracking-[0.16em] uppercase text-dr-mid mb-1">
        {label}
      </div>
      <div className="text-[11px] text-dr-ink">{value}</div>
    </div>
  );
}

function NotificationRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 border border-dr-border">
      <div className="text-[11px] text-dr-ink">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-dr-mid">Email · SMS · Push</span>
        <div className="w-8 h-4.5 bg-dr-success rounded-full relative">
          <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5" />
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-[8px] font-semibold tracking-[0.18em] uppercase text-dr-mid p-2.5 text-left border-b border-dr-border">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`text-[10px] text-dr-ink p-2.5 border-b border-dr-border ${className}`}>
      {children}
    </td>
  );
}

import { getTranslations } from "next-intl/server";
import WaitlistForm from "@/components/forms/WaitlistForm";

interface SkinConcern {
  value: string;
  label: string;
}

export default async function JoinForm() {
  const t = await getTranslations("waitlist");
  const ageOptions = t.raw("ageOptions") as string[];
  const concerns = t.raw("skinConcerns") as SkinConcern[];

  return (
    <section
      id="join"
      className="bg-dr-off py-20 px-6 md:px-12 border-b border-dr-border"
    >
      <div className="max-w-[1200px] mx-auto">
        <WaitlistForm
          title={t.rich("formIntroTitle", {
            em: (chunks) => (
              <em className="italic text-dr-red">{chunks}</em>
            ),
          })}
          subtitle={t("formIntroSub")}
          ageOptions={ageOptions}
          concerns={concerns}
          showSpend={true}
          formId="waitlist"
        />
      </div>
    </section>
  );
}

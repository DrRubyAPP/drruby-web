"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorState } from "@/components/api/ErrorState";
import LogoutButton from "@/components/auth/LogoutButton";
import { NotificationPrefs } from "@/components/sections/portal/NotificationPrefs";
import { PrivacyView } from "@/components/sections/portal/privacy/PrivacyView";
import { DeleteAccountDialog } from "@/components/sections/portal/settings/DeleteAccountDialog";
import { ExportDataButton } from "@/components/sections/portal/settings/ExportDataButton";
import { useApi } from "@/hooks/useApi";
import { Link } from "@/i18n/navigation";
import {
  getInitials,
  getTierKey,
} from "@/lib/portal/dashboard";

interface MeResponse {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  role: string;
  subscriptionTier: string;
}

export default function PortalSettingsPage() {
  const t = useTranslations("portal");
  const [notifExpanded, setNotifExpanded] = useState(false);

  const {
    data: me,
    error: meErr,
    refetch: refetchMe,
  } = useApi<MeResponse>("/api/me");
  const meName = me?.name?.trim() || "";

  return (
    <>
      <h1>Profile &amp; Privacy</h1>
      <div className="pf-head">
        {meErr ? (
          <ErrorState
            message={t("dashboard.profile.error")}
            onRetry={refetchMe}
          />
        ) : (
          <>
            <div className="pf-av">
              {me ? getInitials(meName) || "—" : "—"}
            </div>
            <div>
              <div className="pf-name">{me ? meName || "—" : "—"}</div>
              <div className="pf-meta">
                {me
                  ? t("dashboard.profile.memberSince", {
                      email: me.email,
                      year: new Date(me.memberSince).getFullYear(),
                    })
                  : "—"}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="pf-status">
        <span className="pf-pill on">Private by default</span>
        <span className="pf-pill">No community sharing</span>
        <span className="pf-pill">No active studies</span>
      </div>
      <div className="lede">
        <b>Your data. Your choice.</b> You control what DrRuby can access,
        where it&rsquo;s processed, and what &mdash; if anything &mdash;
        is shared.
      </div>
      <PrivacyView />
      <div className="sec">
        <div className="sec-h">Membership</div>
        <div className="card">
          <div className="sub-row">
            <div className="sr2">
              <b>Your plan</b>
              <span>{me ? t(getTierKey(me.subscriptionTier)) : "—"}</span>
            </div>
            <span className="arr">&rsaquo;</span>
          </div>
          <Link
            href="/pricing"
            className="sub-row"
            style={{ cursor: "pointer", color: "inherit" }}
          >
            <span>View plans</span>
            <span className="arr">&rsaquo;</span>
          </Link>
          <div className="sub-row">
            <span>Manage billing</span>
            <span className="arr">&rsaquo;</span>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Account</div>
        <div className="card">
          <div className="sub-row">
            <span>Your profile</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row">
            <span>Account security</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row" style={{ color: "#8C2635" }}>
            <LogoutButton className="bg-transparent border-0 p-0 text-left text-[14.5px] font-normal cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-60" />
            <span className="arr">&rsaquo;</span>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Your data</div>
        <div className="card">
          <div className="sub-row">
            <div className="sr2">
              <b>Activity log</b>
              <span>Everything DrRuby has recorded.</span>
            </div>
            <span className="arr">&rsaquo;</span>
          </div>
          <ExportDataButton />
          <DeleteAccountDialog />
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Devices &amp; Permissions</div>
        <div className="card">
          <div className="sub-row">
            <span>Connected data sources</span>
            <span className="arr">
              <span className="coming-soon">
                {t("dashboard.comingSoon")}
              </span>
            </span>
          </div>
          <div className="sub-row">
            <span>Permissions</span>
            <span className="arr">
              <span className="coming-soon">
                {t("dashboard.comingSoon")}
              </span>
            </span>
          </div>
          <div className="sub-row">
            <span>Where data is processed</span>
            <span className="arr">
              <span className="coming-soon">
                {t("dashboard.comingSoon")}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Notifications &amp; Appearance</div>
        <div className="card">
          <div
            className="sub-row"
            style={{ cursor: "pointer" }}
            onClick={() => setNotifExpanded((v) => !v)}
          >
            <span>Notification preferences</span>
            <span className="arr">{notifExpanded ? "▾" : "›"}</span>
          </div>
          {notifExpanded && <NotificationPrefs />}
          <div className="sub-row">
            <span>Appearance &amp; language</span>
            <span className="arr">&rsaquo;</span>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Help</div>
        <div className="card">
          <a
            href="mailto:support@drruby.ai"
            className="sub-row"
            style={{ cursor: "pointer", color: "inherit" }}
          >
            <span>Help &amp; support</span>
            <span className="arr">&rsaquo;</span>
          </a>
          <a
            href="mailto:feedback@drruby.ai"
            className="sub-row"
            style={{ cursor: "pointer", color: "inherit" }}
          >
            <span>Report a problem</span>
            <span className="arr">&rsaquo;</span>
          </a>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h">Legal</div>
        <div className="card">
          <div className="sub-row">
            <span>Terms of Service</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row">
            <span>Privacy Policy</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row">
            <span>Consumer Health Data Privacy Policy</span>
            <span className="arr">&rsaquo;</span>
          </div>
          <div className="sub-row">
            <span>Research Consent Terms</span>
            <span className="arr">&rsaquo;</span>
          </div>
        </div>
      </div>
    </>
  );
}

import UserMenu from "@/components/auth/UserMenu";
import { NavDownloadButton } from "@/components/DownloadWaitlist";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { HIDE_HOME_LOGIN } from "@/config/site";
import { getServerSession } from "@/lib/auth/session";

interface HomeNavProps {
  /**
   * Prefixes the in-page section anchors: "" on the homepage (where the
   * sections live), "/" elsewhere (so they jump back to the home page and
   * scroll).
   */
  sectionPrefix?: string;
  /**
   * When true, the actions area becomes session-aware — matching the old
   * app Navbar: locale/theme toggles, a role-based portal/clinic link, and
   * a user menu when signed in. When false (homepage/login), it stays the
   * static marketing header (Log in + Download).
   */
  appControls?: boolean;
  /**
   * When true, the header reads the session and swaps the "Log in" button for
   * the signed-in user's avatar + dropdown menu — without the `appControls`
   * toggles/role links. Used by the marketing homepage. Implied by
   * `appControls`. Reading the session opts the page into dynamic rendering.
   */
  authAware?: boolean;
}

/**
 * Shared top nav for the marketing homepage, login, and the product pages
 * (skin / healthspan / waitlist), so they share one header. Styling comes
 * from `.dr-v5` in home-v5.css, so this must render inside an element with
 * the `dr-v5` class.
 */
export default async function HomeNav({
  sectionPrefix = "",
  appControls = false,
  authAware = false,
}: HomeNavProps) {
  // Read the session whenever the header needs to reflect login state — either
  // the full app controls or just the homepage avatar. The plain login page
  // opts out of both, so its render stays static (no auth lookup).
  const sessionAware = appControls || authAware;
  const session = sessionAware ? await getServerSession() : null;
  const user = session?.user ?? null;
  const role = (user as { role?: string } | null)?.role ?? null;

  return (
    <nav>
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          className="logo"
          href="/"
          aria-label="DrRuby.ai home"
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          <span className="logo-icon" style={{ color: "#fff" }}>
            {/* Brand "R" mark — inline SVG matches design spec v6.5 (#r-open). */}
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <rect x="22" y="15" width="18" height="70" fill="currentColor" />
              <path
                d="M40,15 L58,15 C74,15 78,26 78,34 C78,43 71,48 58,48 L46,48 Z"
                fill="currentColor"
              />
              <path
                d="M46,52 L54,52 L80,85 L64,85 L44,60 Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="logo-word">
            Dr<span className="logo-ruby">Ruby</span>
            <span className="logo-tld">.ai</span>
          </span>
        </a>
        <div className="navlinks">
          <a href={`${sectionPrefix}#how`}>How It Works</a>
          <a href={`${sectionPrefix}#skin`}>Skin</a>
          <a href={`${sectionPrefix}#healthspan`}>Age well</a>
          {role === "clinic" && <a href="/clinic">For Clinics</a>}
          <a href="/collaborate">Collaborate</a>
          <a href={`${sectionPrefix}#science`}>Trust</a>
          <a href={`${sectionPrefix}#pricing`}>Pricing</a>
          {appControls && user && role === "user" && (
            <a href="/portal">Portal</a>
          )}
          {appControls && user && role === "clinic" && (
            <a href="/clinic">Clinic</a>
          )}
          {appControls && user && role === "collaborator" && (
            <a href="/collaborate/workspace">Workspace</a>
          )}
        </div>
        <div className="actions">
          {appControls && <LocaleSwitcher />}
          {appControls && <ThemeToggle />}
          {HIDE_HOME_LOGIN ? (
            // 登录入口被 NEXT_PUBLIC_HIDE_HOME_LOGIN=true 屏蔽：未登录不显示
            // Log in 按钮，已登录也不显示用户头像。Download CTA 照常保留
            // （appControls 页本身不带 Download）。
            !appControls && <NavDownloadButton />
          ) : sessionAware && user ? (
            <>
              {/* Signed in: avatar sits leftmost in the actions cluster and
                  opens the account dropdown. The homepage keeps its Download
                  CTA alongside; the app-control pages don't carry one. */}
              <UserMenu
                role={role}
                image={user.image}
                name={user.name}
                email={user.email}
              />
              {!appControls && <NavDownloadButton />}
            </>
          ) : (
            <>
              <a
                className="btn ghost"
                href={sessionAware ? "/login" : "/portal"}
              >
                Log in
              </a>
              <NavDownloadButton />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

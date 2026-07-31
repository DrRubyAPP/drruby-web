import UserMenu from "@/components/auth/UserMenu";
import { NavDownloadButton } from "@/components/DownloadWaitlist";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
}: HomeNavProps) {
  // Only touch the session when the caller opts into session-aware controls,
  // so the static homepage/login render stays free of the auth lookup.
  const session = appControls ? await getServerSession() : null;
  const user = session?.user ?? null;
  const role = (user as { role?: string } | null)?.role ?? null;

  return (
    <nav>
      <div
        className="wrap"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <a className="logo" href="/">
          Dr<span>Ruby</span>.ai
        </a>
        <div className="navlinks">
          <a href={`${sectionPrefix}#how`}>How It Works</a>
          <a href={`${sectionPrefix}#skin`}>Skin</a>
          <a href={`${sectionPrefix}#healthspan`}>Age well</a>
          <a href="/clinic">For Clinics</a>
          <a href="/collaborate">Collaborate</a>
          <a href={`${sectionPrefix}#science`}>Trust</a>
          <a href="/pricing">Pricing</a>
          {appControls && user && role === "user" && <a href="/portal">Portal</a>}
          {appControls && user && role === "clinic" && <a href="/clinic">Clinic</a>}
        </div>
        <div className="actions">
          {appControls && <LocaleSwitcher />}
          {appControls && <ThemeToggle />}
          {appControls && user ? (
            <UserMenu
              role={role}
              image={user.image}
              name={user.name}
              email={user.email}
            />
          ) : (
            <>
              <a className="btn ghost" href={appControls ? "/login" : "/portal"}>
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

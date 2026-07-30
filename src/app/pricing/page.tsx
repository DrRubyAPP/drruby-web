import type { Metadata } from "next";
import Link from "next/link";
import "./pricing.css";

export const metadata: Metadata = {
  title: "DrRuby.ai — Membership & Pricing",
  description:
    "Start free — your history is always yours. Pay only when you want deeper understanding before a decision that matters.",
};

export default function PricingPage() {
  return (
    <div className="dr-pricing">
      <nav>
        <div className="wrap">
          <Link className="logo" href="/">
            Dr<b>Ruby</b>.ai
          </Link>
          <a className="link" href="#growth">
            How membership works
          </a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <h1 className="serif">Your next decision gets easier.</h1>
          <p>Build a history that belongs to you. Understand yourself before you decide.</p>
          <div className="assure">Start free. Your data is always yours.</div>
          <div className="hero-cta">
            <Link className="btn primary" href="/#start">
              Start Your Journey
            </Link>
            <a className="link" href="#growth">
              See how membership works &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* PRICING CARDS */}
      <section className="wrap" id="cards">
        <div className="cards">
          <div className="pcard">
            <div className="pname">Free</div>
            <div className="pvalue serif">Remember yourself.</div>
            <div className="pline">Build a history you can return to.</div>
            <ul>
              <li>Record photos, changes, decisions and outcomes</li>
              <li>Keep your personal timeline</li>
              <li>Receive basic summaries</li>
              <li>Read public learning resources</li>
            </ul>
            <div className="price">$0</div>
            <div className="price-note">Free, always.</div>
            <Link className="btn ghost" href="/#start">
              Start Your Journey
            </Link>
            <div className="pfoot">Your history remains yours, whether or not you ever pay.</div>
          </div>

          <div className="pcard feature">
            <div className="ptag">For moments when a decision matters</div>
            <div className="pname">Decision</div>
            <div className="pvalue serif">Understand yourself.</div>
            <div className="pline">Be better prepared when a decision matters.</div>
            <ul>
              <li>Understand the decision in the context of your history</li>
              <li>Review relevant experiences, evidence and expert perspectives</li>
              <li>See tradeoffs and questions worth considering</li>
              <li>Prepare more clearly for a conversation with your doctor</li>
            </ul>
            <div className="price" style={{ fontSize: 18, color: "var(--slate)" }}>
              Pricing announced before launch
            </div>
            <div className="price-note">A single, clear price &mdash; no ranges, no confusion.</div>
            <Link className="btn primary" href="/#start">
              Be ready for my next decision
            </Link>
            <div className="pfoot">Cancel anytime &mdash; your history is never deleted or locked.</div>
          </div>
        </div>
        <p
          className="serif"
          style={{
            textAlign: "center",
            maxWidth: 700,
            margin: "34px auto 0",
            fontSize: 21,
            lineHeight: 1.5,
            color: "var(--deep)",
          }}
        >
          You never pay to unlock your own data. You pay when you want deeper understanding before an
          important decision.
        </p>
      </section>

      {/* TRUST BAND */}
      <section className="wrap">
        <div className="trust">
          <h2 className="serif">Your trust is not a premium feature.</h2>
          <div className="always">On every plan, always</div>
          <ul>
            <li>Your data belongs to you</li>
            <li>Private by default</li>
            <li>We never sell your personal data</li>
            <li>We support your decisions. We don&rsquo;t make them for you</li>
            <li>Export or delete anytime</li>
          </ul>
          <div style={{ marginTop: 26, fontSize: 14, color: "rgba(255,255,255,.6)" }}>
            We earn your trust before we earn your revenue.
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <h2 className="serif">Understanding grows over time.</h2>
          <p className="sub">
            The longer you use DrRuby, the more context you build &mdash; and the more useful each
            future decision becomes.
          </p>
        </div>
      </section>

      {/* GROWTH PATH */}
      <section className="sec" id="growth" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <h2 className="serif">DrRuby grows with you.</h2>
          <p className="sub">
            Start with your own history. Grow into deeper understanding when you need it.
          </p>
          <div className="growth">
            <div className="gstep">
              <h4>Remember yourself</h4>
              <p className="gdesc">
                A history that grows with you &mdash; your photos, decisions and outcomes, all in one
                place.
              </p>
              <div className="goutcome">&rarr; Never lose your story.</div>
              <span className="gpill on">Available today</span>
            </div>
            <div className="gstep">
              <h4>Understand yourself</h4>
              <p className="gdesc">
                When a decision matters, understand it in the context of your own history.
              </p>
              <div className="goutcome">&rarr; Decide with more confidence.</div>
              <span className="gpill on">Available today</span>
            </div>
            <div className="gstep dev">
              <h4>Learn from others</h4>
              <p className="gdesc">
                One day, learn from women who chose to share their journeys &mdash; organized,
                thoughtful, and respectful of privacy.
              </p>
              <div className="goutcome">&rarr; You&rsquo;re no longer learning alone.</div>
              <span className="gpill dev">Coming next</span>
              <a className="gwait" href="#">
                Join the waitlist &rarr;
              </a>
            </div>
            <div className="gstep dev">
              <h4>Navigate with professionals</h4>
              <p className="gdesc">
                In time, bring a richer understanding of your health into every conversation with your
                doctor.
              </p>
              <div className="gbrand">DrRuby prepares. You and your doctor decide.</div>
              <div className="goutcome">
                &rarr; You don&rsquo;t start from zero every time you see your doctor.
              </div>
              <span className="gpill dev">Looking ahead</span>
              <a className="gwait" href="#">
                Join the waitlist &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="wrap">
        <details className="compare">
          <summary>Compare plans in detail &rarr;</summary>
          <table className="ctable">
            <thead>
              <tr>
                <th>What you get</th>
                <th>Free</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr className="grp">
                <td colSpan={3}>Build your history</td>
              </tr>
              <tr>
                <td>Record photos, changes, decisions, outcomes</td>
                <td className="ck">&#10003;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr>
                <td>Personal timeline &amp; basic summaries</td>
                <td className="ck">&#10003;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr className="grp">
                <td colSpan={3}>Understand a decision</td>
              </tr>
              <tr>
                <td>Your decision in the context of your history</td>
                <td className="dash">&mdash;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr>
                <td>Relevant evidence &amp; expert perspectives</td>
                <td className="dash">&mdash;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr>
                <td>Tradeoffs &amp; questions for your doctor</td>
                <td className="dash">&mdash;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr className="grp">
                <td colSpan={3}>Learn from relevant experiences</td>
              </tr>
              <tr>
                <td>A few relevant journeys, summarized</td>
                <td className="dash">&mdash;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr className="grp">
                <td colSpan={3}>Privacy &amp; ownership</td>
              </tr>
              <tr>
                <td>Your data belongs to you &middot; private by default</td>
                <td className="ck">&#10003;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr>
                <td>Never sold &middot; export or delete anytime</td>
                <td className="ck">&#10003;</td>
                <td className="ck">&#10003;</td>
              </tr>
              <tr>
                <td>We support your decisions. We don&rsquo;t make them.</td>
                <td className="ck">&#10003;</td>
                <td className="ck">&#10003;</td>
              </tr>
            </tbody>
          </table>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--muted)", marginTop: 12 }}>
            Privacy and ownership are the same on every plan &mdash; never a difference between tiers.
          </div>
        </details>
      </section>

      {/* FAQ */}
      <section className="sec">
        <div className="wrap">
          <h2 className="serif">Questions</h2>
          <div className="faq">
            <div className="q">
              <h4>Will DrRuby sell my data?</h4>
              <p>
                No. DrRuby&rsquo;s business model is based on membership, not selling personal data.
              </p>
            </div>
            <div className="q">
              <h4>Do I have to pay to access my own history?</h4>
              <p>
                No. Your history remains available to read and export, even if you don&rsquo;t
                subscribe or later downgrade.
              </p>
            </div>
            <div className="q">
              <h4>Does DrRuby tell me what treatment to choose?</h4>
              <p>
                No. DrRuby helps you understand context, evidence, experiences and tradeoffs. The
                decision remains yours.
              </p>
            </div>
            <div className="q">
              <h4>Is using DrRuby the same as joining research?</h4>
              <p>No. Research participation is separate and always opt-in.</p>
            </div>
            <div className="q">
              <h4>What happens if I cancel?</h4>
              <p>
                Your premium analysis stops, but your history is not deleted or locked. You can
                continue to read and export it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap">
          &copy; 2026 DrRuby.ai &middot; Illustrative membership concept, pre-launch &middot; Privacy
          &middot; Terms
        </div>
      </footer>
    </div>
  );
}

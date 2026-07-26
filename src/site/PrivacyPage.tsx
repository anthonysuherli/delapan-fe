import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

/**
 * Privacy policy — template-grade, for the invite-gated beta. Plain
 * language, factual claims kept true of the real system (Supabase for
 * auth/db, Vercel for hosting, explore's outbound calls). `[contact email]`
 * stays a literal placeholder; do not invent one.
 */
export function PrivacyPage() {
  usePageTitle("delapan — privacy");

  return (
    <SiteShell>
      <div className="about">
        <article className="docs-article">
          <h1>privacy policy</h1>
          <p className="legal-meta">last updated 2026-07-26</p>
          <p className="legal-banner">
            this policy is a plain-language template for the invite-gated beta; it is not legal
            advice.
          </p>

          <h2>what we store</h2>
          <p>
            the account email you sign up with, via Supabase Auth; the findings and graphs you
            create in the product; and operational logs needed to run and debug the service.
          </p>

          <h2>processors</h2>
          <p>
            a small set of outside services process data on our behalf. Supabase handles the
            database and authentication. Vercel hosts the application. when you use explore, the
            content you explicitly submit through it is sent to LLM providers (Anthropic and
            OpenAI-compatible gateways) and to the Tavily search API, so they can do the research
            and generation work explore does. nothing else you haven't submitted through explore
            leaves the system that way.
          </p>

          <h2>what we don't do</h2>
          <p>
            we don't run ads. we don't sell your data. we don't train models on your content.
          </p>

          <h2>retention &amp; deletion</h2>
          <p>
            deleting your account removes your organization's data on request — contact us and
            we'll take care of it (see contact below).
          </p>

          <h2>cookies</h2>
          <p>
            delapan uses one cookie: the Supabase auth session that keeps you signed in. no
            tracking or advertising cookies.
          </p>

          <h2>contact</h2>
          <p>
            questions about this policy, or want your data exported or deleted? reach out at{" "}
            <code>[contact email]</code>.
          </p>
        </article>
      </div>
    </SiteShell>
  );
}

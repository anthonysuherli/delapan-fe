import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

/**
 * Terms of service — template-grade, for the invite-gated beta. Plain
 * language, no legalese dressing. `[jurisdiction]` and `[contact email]`
 * stay literal placeholders until a real entity/contact is chosen; do not
 * invent values for either.
 */
export function TermsPage() {
  usePageTitle("delapan — terms");

  return (
    <SiteShell>
      <div className="about">
        <article className="docs-article">
          <h1>terms of service</h1>
          <p className="legal-meta">last updated 2026-07-26</p>
          <p className="legal-banner">
            these terms are a plain-language template for the invite-gated beta; they are not
            legal advice.
          </p>

          <h2>acceptance</h2>
          <p>
            by creating an account or otherwise using delapan, you agree to these terms. if you
            don't agree, don't use the service.
          </p>

          <h2>the service</h2>
          <p>
            delapan is currently an invite-gated beta. the service — the graph, the research
            pipeline, and everything reachable through explore — is provided as-is, without
            warranty of any kind. features, behavior, and availability can change while the beta
            is running.
          </p>

          <h2>accounts</h2>
          <p>
            you're responsible for the accuracy of the information on your account and for
            keeping your credentials secure. each account belongs to one organization — you don't
            get to spin up several under one identity. you own the content you create and submit:
            findings, graphs, and anything else you write into the system remain yours.
          </p>

          <h2>acceptable use</h2>
          <p>
            don't use delapan for anything unlawful. don't abuse the research pipeline — no
            scraping it for unrelated purposes, no attempts to exhaust or game it beyond ordinary
            use. don't attempt to access another organization's data or tenant; the system is
            built to keep tenants separate, and trying to get around that is a violation of these
            terms.
          </p>

          <h2>availability &amp; changes</h2>
          <p>
            this is a beta. we can change, suspend, or pause the service, in whole or in part, at
            any time, including features you rely on. if that affects your organization's data in
            a way that matters to you, you can request an export — see contact below.
          </p>

          <h2>termination</h2>
          <p>
            you can stop using delapan at any time. we can suspend or terminate an account for
            violating these terms, including the acceptable-use section above. on termination,
            your organization's data is handled per the retention terms in the{" "}
            <a href="/privacy">privacy policy</a>.
          </p>

          <h2>liability</h2>
          <p>
            to the extent permitted by law, delapan is not liable for indirect, incidental, or
            consequential damages arising from your use of the service. our total liability for
            any claim is capped at the fees you've paid for the service — currently zero, since
            the beta is free.
          </p>

          <h2>governing law</h2>
          <p>
            these terms are governed by the laws of <code>[jurisdiction]</code>, without regard to
            conflict-of-law principles.
          </p>

          <h2>contact</h2>
          <p>
            questions about these terms? reach out at <code>[contact email]</code>.
          </p>
        </article>
      </div>
    </SiteShell>
  );
}

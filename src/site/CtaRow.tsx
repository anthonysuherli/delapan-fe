/**
 * The one signup CTA — used by the landing hero, closing section, and
 * anywhere else on the site that asks for an account. Single source of the
 * beta note so the string can't drift between call sites.
 */
export function CtaRow() {
  return (
    <div className="ss-cta-row">
      <a className="ss-cta" href="/signup">
        create an account
      </a>
      <span className="ss-cta-note">free · invite-gated beta</span>
    </div>
  );
}

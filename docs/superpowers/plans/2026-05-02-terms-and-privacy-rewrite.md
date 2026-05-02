# Terms of Service & Privacy Policy Rewrite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v0.app-generated EULA and Privacy Policy with professionally written Terms of Service and Privacy Policy pages, rename the EULA route to `/terms`, and rename the DB column `eula_accepted_at` → `terms_accepted_at`.

**Architecture:** Content-only rewrite — no new logic, no new components. The existing consent-recording mechanism (checkboxes + `user_consents` table) is preserved; only the column name, text strings, and page content change. The `/eula` route is replaced by `/terms` with a permanent redirect in `next.config.mjs`.

**Tech Stack:** Next.js 15 (App Router), Supabase, Vitest + React Testing Library, TypeScript

**Branch:** `feat/terms-privacy-rewrite` (already created — all work goes here)

**Spec:** `docs/superpowers/specs/2026-05-02-terms-and-privacy-rewrite-design.md`

---

## File Map

| File | Change |
|------|--------|
| `migrations/0013-rename-eula-to-terms.sql` | Create — rename DB column |
| `migrations/0008-add_invitations_and_consents.sql` | **Do not edit** — historical record; contains `eula_accepted_at` but migration files must not be altered after they have been applied |
| `scripts/create_user_consents_table.sql` | Update — rename column in reference script |
| `lib/actions/auth.tsx` | Update — column ref, param name, form field name, error string |
| `tests/unit/lib/actions/auth.test.ts` | Update — form field key, error string assertion |
| `app/terms/page.tsx` | Create — new Terms of Service page |
| `app/eula/page.tsx` | Delete — replaced by /terms |
| `next.config.mjs` | Update — add permanent redirect /eula → /terms |
| `app/privacy-policy/page.tsx` | Rewrite — full content replacement |
| `lib/supabase/middleware.ts` | Update — swap /eula → /terms in PUBLIC_ROUTES |
| `components/legal-footer.tsx` | Update — link href + label |
| `tests/components/legal-footer.test.tsx` | Update — href + label assertions |
| `components/sign-up-form.tsx` | Update — state key, form field, link, label, error string |
| `tests/components/sign-up-form.test.tsx` | Update — label, link, error string assertions |
| `components/login-form.tsx` | Update — "End User License Agreement" text |
| `tests/components/login-form.test.tsx` | Update — text assertion |
| Generated Supabase types | **Not present** — no `lib/database.types.ts` or equivalent exists in this project; no action needed |

---

## Task 1: DB Migration — Rename `eula_accepted_at` → `terms_accepted_at`

**Files:**
- Create: `migrations/0013-rename-eula-to-terms.sql`
- Modify: `scripts/create_user_consents_table.sql`

- [ ] **Step 1: Create migration file**

Create `migrations/0013-rename-eula-to-terms.sql`:

```sql
-- Rename eula_accepted_at to terms_accepted_at to match the renamed document
ALTER TABLE user_consents RENAME COLUMN eula_accepted_at TO terms_accepted_at;
```

- [ ] **Step 2: Update reference script**

In `scripts/create_user_consents_table.sql`, line 5: change `eula_accepted_at` to `terms_accepted_at`:

```sql
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
```

- [ ] **Step 3: Apply migration to Supabase**

Run in Supabase SQL editor (Dashboard → SQL Editor) or via CLI:
```
supabase db push
```
Verify: the `user_consents` table now has `terms_accepted_at` instead of `eula_accepted_at`.

- [ ] **Step 4: Commit**

```bash
git add migrations/0013-rename-eula-to-terms.sql scripts/create_user_consents_table.sql
git commit -m "feat: rename eula_accepted_at to terms_accepted_at in user_consents"
```

---

## Task 2: Update Auth Action (TDD)

**Files:**
- Modify: `lib/actions/auth.tsx`
- Modify: `tests/unit/lib/actions/auth.test.ts`

- [ ] **Step 1: Update the test first — form field key**

In `tests/unit/lib/actions/auth.test.ts`, replace ALL occurrences of:
```
formData.append("eulaAccepted", ...
```
with:
```
formData.append("termsAccepted", ...
```
This affects lines at approximately 100, 150, 166, 186, 230, 268, 325, 377, 400.

Use find-and-replace: `formData.append("eulaAccepted",` → `formData.append("termsAccepted",`

- [ ] **Step 2: Update the test — error string and it() description**

In `tests/unit/lib/actions/auth.test.ts`:

a) Change the error string assertion (around line 155):
```ts
expect(result).toEqual({ error: "You must accept both the Terms of Service and Privacy Policy to create an account" })
```

b) Update the stale `it()` description (around line 143):
```ts
it("should return error when Terms of Service or Privacy Policy not accepted", async () => {
```

- [ ] **Step 3: Run test to verify it fails**

```
npx vitest run tests/unit/lib/actions/auth.test.ts
```
Expected: FAIL — the action still reads `eulaAccepted` and returns the old error string.

- [ ] **Step 4: Update auth action — form field reader**

In `lib/actions/auth.tsx`, line ~351, change:
```ts
const eulaAccepted = formData.get("eulaAccepted") === "true" || formData.get("eulaAccepted") === "on"
```
to:
```ts
const termsAccepted = formData.get("termsAccepted") === "true" || formData.get("termsAccepted") === "on"
```

- [ ] **Step 5: Update auth action — variable name and downstream references**

The variable `eulaAccepted` is used at lines ~355 and ~415. Rename all three occurrences in this function to `termsAccepted`:

Line ~355:
```ts
const validationError = validateSignupFields(email, password, fullName, school, teacher, termsAccepted, privacyAccepted)
```

Line ~415:
```ts
const consentResult = await storeUserConsent(data.user.id, termsAccepted, privacyAccepted)
```

- [ ] **Step 6a: Update `validateSignupFields` function (line ~52)**

`validateSignupFields` is defined around line 52. It takes `eulaAccepted: boolean` as a parameter. Rename that parameter and update the error string:

```ts
function validateSignupFields(
  ...,
  termsAccepted: boolean,
  privacyAccepted: boolean
): string | null {
  if (!termsAccepted || !privacyAccepted) {
    return "You must accept both the Terms of Service and Privacy Policy to create an account"
  }
  // rest of function unchanged
```

- [ ] **Step 6b: Update `storeUserConsent` function (line ~117)**

`storeUserConsent` is defined around line 117 (not line 52 — that is a different function). It accepts `eulaAccepted: boolean` as its second parameter and writes to the `eula_accepted_at` column. Rename the parameter and update the column name:

Function signature (line ~117):
```ts
async function storeUserConsent(userId: string, termsAccepted: boolean, privacyAccepted: boolean)
```

Insert/upsert object (line ~126):
```ts
terms_accepted_at: termsAccepted ? now : null,
```

- [ ] **Step 7: Run test to verify it passes**

```
npx vitest run tests/unit/lib/actions/auth.test.ts
```
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/actions/auth.tsx tests/unit/lib/actions/auth.test.ts
git commit -m "feat: rename eulaAccepted to termsAccepted and update error message in auth action"
```

---

## Task 3: Create `/terms` Page + Redirect + Delete `/eula`

**Files:**
- Create: `app/terms/page.tsx`
- Modify: `next.config.mjs`
- Delete: `app/eula/page.tsx`

- [ ] **Step 1: Create `app/terms/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Okinawa Kobudo Library",
  description: "Terms of Service for Okinawa Kobudo Library",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Terms of Service</h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-6 text-gray-300 leading-relaxed">
              <p className="text-lg font-medium text-white">Okinawa Kobudo Library</p>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance</h2>
                <p>
                  Access to this platform requires creating an account. During registration you will be asked to
                  explicitly accept these Terms of Service by checking a confirmation box. You may not complete
                  registration without accepting. Your acceptance is recorded with a timestamp.
                </p>
                <p className="mt-2">
                  Continued use of the platform after any update to these Terms constitutes acceptance of the revised
                  version. The &quot;Last updated&quot; date at the bottom of this page reflects the current version.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. About the Service</h2>
                <p>
                  Okinawa Kobudo Library is a private, approval-gated video library for authorised members, operated
                  by TY Kobudo (sole trader, New South Wales, Australia). Contact:{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Access &amp; Registration</h2>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Access is approval-gated; membership is not automatic on registration.</li>
                  <li>
                    You must provide accurate information during registration: first and last name, email address,
                    school/dojo affiliation, and your teacher&apos;s name. You agree to keep this information up to
                    date.
                  </li>
                  <li>
                    You are responsible for maintaining the security of your login credentials and must report any
                    unauthorised use immediately.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Permitted Use</h2>
                <p>
                  TY Kobudo grants you a limited, non-exclusive, non-transferable, revocable licence to access and use
                  the video library and associated materials for your personal, non-commercial educational purposes as
                  an authorised member.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Restrictions</h2>
                <p>You must not:</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>
                    Download, copy, screen-record, reproduce, republish, upload, or distribute any video content or
                    platform materials;
                  </li>
                  <li>Share your account credentials with others;</li>
                  <li>
                    Attempt to reverse-engineer, circumvent, or compromise the platform&apos;s security or access
                    controls;
                  </li>
                  <li>Use the platform or any content for commercial purposes.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
                <p>
                  All video, written, and photographic content is owned by TY Kobudo or licensed to TY Kobudo, and is
                  protected by copyright and applicable laws. Use of the platform grants no ownership rights to you.
                </p>
                <p className="mt-2">
                  <strong>Copyright Notice:</strong> Copyright &copy; Tony Young. All rights reserved. No content may
                  be reproduced or redistributed without explicit written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Recorded With Permission</h2>
                <p>
                  All performances depicted in the platform&apos;s videos have been recorded and published with the
                  explicit consent of the individuals featured.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Minors</h2>
                <p>
                  Membership is generally restricted to adults. A head teacher may register a member under 18 at their
                  discretion; in that case, the head teacher is responsible for having obtained appropriate parental or
                  guardian consent before registration. TY Kobudo does not verify member age.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Free Service &amp; Donations</h2>
                <p>
                  The platform is currently free to access. Voluntary donations are supported via Stripe. Stripe
                  processes donation payments under its own Terms of Service and Privacy Policy; TY Kobudo does not
                  store card or payment details.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Prohibited Conduct</h2>
                <p>You must not:</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Attempt to access, alter, or delete another member&apos;s account or data;</li>
                  <li>Use automated tools to scrape or bulk-access the platform;</li>
                  <li>Interfere with or attempt to disrupt the operation of the platform;</li>
                  <li>Store or transmit content that violates applicable law.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">11. Disclaimer of Warranties</h2>
                <p>
                  The platform is provided as-is and as-available. TY Kobudo makes no warranties regarding uptime,
                  content accuracy, or fitness for a particular purpose. The platform may be changed, suspended, or
                  discontinued at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">12. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, TY Kobudo is not liable for any loss of data, loss of
                  access, or indirect or consequential damages arising from use of or inability to use the platform.
                  Nothing in these Terms excludes, restricts, or modifies rights that cannot be excluded under the
                  Australian Consumer Law or any other applicable legislation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">13. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless TY Kobudo from any loss, liability, or claim arising from
                  your violation of these Terms or misuse of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">14. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the
                  exclusive jurisdiction of the courts of New South Wales.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">15. Changes &amp; Contact</h2>
                <p>
                  TY Kobudo may update these Terms at any time. The &quot;Last updated&quot; date at the bottom of
                  this page reflects the current version. Continued use after an update constitutes acceptance.
                </p>
                <p className="mt-2">
                  Questions:{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                </p>
              </section>

              <p className="pt-2">
                <strong>
                  By creating an account and accepting these Terms at registration, you agree to be bound by them.
                </strong>
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-400">Last updated: 2 May 2026</p>
            <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-gray-200 underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add redirect in `next.config.mjs`**

The file currently exports a `nextConfig` object with `images` and `env` keys. Add a `redirects()` async function to it — do NOT replace the whole file, just add the new key:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/eula",
        destination: "/terms",
        permanent: true,
      },
    ]
  },
  images: {
    // ... existing content unchanged ...
  },
  env: {
    // ... existing content unchanged ...
  },
}
```

- [ ] **Step 3: Delete `app/eula/page.tsx`**

```bash
git rm app/eula/page.tsx
```

- [ ] **Step 4: Type-check and lint**

```
npm run type-check
npm run lint
```
Expected: no errors from either command.

- [ ] **Step 5: Commit**

`git rm app/eula/page.tsx` in Step 3 already staged the deletion. The commit below picks it up:

```bash
git add app/terms/page.tsx next.config.mjs
git commit -m "feat: add Terms of Service page at /terms with redirect from /eula"
```

---

## Task 4: Rewrite Privacy Policy Page

**Files:**
- Rewrite: `app/privacy-policy/page.tsx`

- [ ] **Step 1: Replace content of `app/privacy-policy/page.tsx`**

```tsx
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Okinawa Kobudo Library",
  description: "Privacy Policy for Okinawa Kobudo Library",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-orange-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">Privacy Policy</h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="space-y-6 text-gray-300 leading-relaxed">

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
                <p>
                  Okinawa Kobudo Library is operated by TY Kobudo, a sole-trader software business based in New South
                  Wales, Australia. Contact:{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. What Data We Collect</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 pr-4 text-white font-semibold">Data</th>
                        <th className="text-left py-2 text-white font-semibold">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      <tr>
                        <td className="py-2 pr-4 align-top">First and last name</td>
                        <td className="py-2 align-top">Identity and account management</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Email address</td>
                        <td className="py-2 align-top">Account access and communications</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">School/dojo affiliation</td>
                        <td className="py-2 align-top">Membership verification</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Teacher/sensei name</td>
                        <td className="py-2 align-top">Membership verification</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Belt/grade level (optional, if set by user)</td>
                        <td className="py-2 align-top">Profile personalisation</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">
                          Terms of Service and Privacy Policy acceptance timestamps
                        </td>
                        <td className="py-2 align-top">Consent recording</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Browser type, device, and usage data</td>
                        <td className="py-2 align-top">Platform improvement and analytics</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">
                          Server request logs: IP address, request path, timestamp
                        </td>
                        <td className="py-2 align-top">Security monitoring and error diagnosis</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">
                  No payment card details are collected or stored by TY Kobudo. Donation payment data is processed
                  directly by Stripe.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. How We Collect Your Information</h2>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Registration form (name, email, school/dojo, teacher name)</li>
                  <li>Profile settings (belt/grade level, if provided)</li>
                  <li>Platform use (cookies, analytics, server logs)</li>
                  <li>Communications via email or the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. How We Use Your Information</h2>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Providing and managing access to the video library</li>
                  <li>Maintaining and administering user accounts</li>
                  <li>Recording consent at registration</li>
                  <li>Communicating important updates or support information</li>
                  <li>Improving and personalising your experience</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Infrastructure &amp; Data Processors</h2>
                <p>
                  We do not sell personal data. We do not disclose personal data to third parties for marketing
                  purposes.
                </p>
                <p className="mt-2">
                  To operate the platform, your data is processed by the following infrastructure providers acting as
                  data processors:
                </p>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 pr-4 text-white font-semibold">Provider</th>
                        <th className="text-left py-2 pr-4 text-white font-semibold">Role</th>
                        <th className="text-left py-2 text-white font-semibold">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      <tr>
                        <td className="py-2 pr-4 align-top">Supabase</td>
                        <td className="py-2 pr-4 align-top">Database — stores account and profile data</td>
                        <td className="py-2 align-top">AWS ap-southeast-2, Sydney, Australia</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Vercel</td>
                        <td className="py-2 pr-4 align-top">Hosting — processes standard web request logs</td>
                        <td className="py-2 align-top">Global CDN</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 align-top">Stripe</td>
                        <td className="py-2 pr-4 align-top">
                          Payment processing — handles voluntary donation payments
                        </td>
                        <td className="py-2 align-top">Subject to Stripe&apos;s Privacy Policy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">
                  Supabase and Vercel do not use your data for their own purposes. Stripe processes only donation
                  payment data and is not provided with other personal information. Each provider operates under their
                  own Data Processing Agreement or Privacy Policy.
                </p>
                <p className="mt-2">
                  Data may also be disclosed to comply with legal obligations or in the event of a business transfer or
                  merger.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Data Storage &amp; Sovereignty</h2>
                <p>
                  Your account data is stored in Supabase&apos;s ap-southeast-2 region (Sydney, Australia). For
                  Australian members, this means your data remains onshore. International members&apos; data is also
                  stored in Sydney; transfer protections appropriate to the destination country apply where required.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Minors</h2>
                <p>
                  Membership is generally restricted to adults. A head teacher may register a member under 18 at their
                  discretion; in that case, the head teacher is responsible for having obtained appropriate parental or
                  guardian consent before registration. TY Kobudo does not independently verify member age.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Cookies &amp; Tracking</h2>
                <p>
                  The platform uses session and authentication cookies necessary for the service to function. Usage
                  analytics may be collected to improve the platform. No advertising cookies, tracking pixels, or
                  third-party analytics are used. You may disable cookies in your browser settings; some features may
                  not function as a result.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">9. Data Retention</h2>
                <p>
                  Data is retained while your account is active or as required by applicable law. To request deletion
                  of your account and associated data, contact{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                  . Requests will be actioned within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">10. Your Rights (Australian Users)</h2>
                <p>Under the Australian Privacy Act 1988 you may:</p>
                <ul className="list-disc list-inside ml-6 space-y-1">
                  <li>Request access to personal information we hold about you</li>
                  <li>Request correction of inaccurate or out-of-date information</li>
                  <li>Request deletion of your data, subject to legal obligations</li>
                  <li>
                    Complain to the Office of the Australian Information Commissioner (
                    <a
                      href="https://www.oaic.gov.au"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-white underline"
                    >
                      oaic.gov.au
                    </a>
                    ) if you believe your privacy rights have been breached
                  </li>
                </ul>
                <p className="mt-2">
                  To exercise any of these rights, contact{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">11. International Users &amp; GDPR</h2>
                <p>
                  This service is operated from Australia and is governed by Australian privacy law. If you are located
                  in the European Union or European Economic Area, the General Data Protection Regulation (GDPR) may
                  apply to you and may grant additional rights, including the right to data portability, the right to
                  object to processing, and the right to lodge a complaint with your local supervisory authority.
                </p>
                <p className="mt-2">
                  EU/EEA residents may use the platform. Where GDPR applies, the lawful basis for processing your
                  personal data is legitimate interests (operating a private educational platform for authorised
                  members) and, where required, your explicit consent given at registration. We are not yet actively
                  marketing to EU residents; before doing so, this Privacy Policy will be updated to fully address GDPR
                  requirements including appointment of an EU representative where required.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">12. Changes &amp; Contact</h2>
                <p>
                  The &quot;Last updated&quot; date at the bottom of this page reflects the current version. We will
                  post a notice when material changes are made.
                </p>
                <p className="mt-2">
                  Privacy enquiries and data deletion requests:{" "}
                  <a href="mailto:admin@tykobudo.com.au" className="text-gray-200 hover:text-white underline">
                    admin@tykobudo.com.au
                  </a>
                </p>
                <p className="mt-1">
                  Office of the Australian Information Commissioner:{" "}
                  <a
                    href="https://www.oaic.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-200 hover:text-white underline"
                  >
                    oaic.gov.au
                  </a>
                </p>
              </section>

            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-sm text-gray-400">Last updated: 2 May 2026</p>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-200 underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/privacy-policy/page.tsx
git commit -m "feat: rewrite Privacy Policy with infrastructure details, GDPR note, and data table"
```

---

## Task 5: Update Middleware Public Routes

**Files:**
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1: Swap `/eula` for `/terms` in PUBLIC_ROUTES**

In `lib/supabase/middleware.ts`, lines 11–19, the `PUBLIC_ROUTES` set contains `"/eula"`. Replace it with `"/terms"`:

```ts
const PUBLIC_ROUTES = new Set([
  "/pending-approval",
  "/setup-admin",
  "/privacy-policy",
  "/terms",
  "/auth/confirm",
  "/auth/confirm/callback",
  "/auth/reset-password",
])
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: replace /eula with /terms in middleware public route allowlist"
```

---

## Task 6: Update Legal Footer (TDD)

**Files:**
- Modify: `components/legal-footer.tsx`
- Modify: `tests/components/legal-footer.test.tsx`

- [ ] **Step 1: Update test first**

In `tests/components/legal-footer.test.tsx`, update the EULA test (around lines 16–24):

```ts
it("should render Terms of Service link with correct attributes", () => {
  render(<LegalFooter />)

  const termsLink = screen.getByRole("link", { name: /terms of service/i })

  expect(termsLink).toHaveAttribute("href", "/terms")
  expect(termsLink).toHaveAttribute("target", "_blank")
  expect(termsLink).toHaveAttribute("rel", "noopener noreferrer")
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/components/legal-footer.test.tsx
```
Expected: FAIL — component still has `/eula` and "End User License Agreement".

- [ ] **Step 3: Update component**

In `components/legal-footer.tsx`, replace the EULA anchor:

```tsx
<a
  href="/terms"
  target="_blank"
  rel="noopener noreferrer"
  className="text-gray-200 hover:text-white transition-colors underline"
>
  Terms of Service
</a>
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run tests/components/legal-footer.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/legal-footer.tsx tests/components/legal-footer.test.tsx
git commit -m "feat: update legal footer EULA link to Terms of Service at /terms"
```

---

## Task 7: Update Sign-Up Form (TDD)

**Files:**
- Modify: `components/sign-up-form.tsx`
- Modify: `tests/components/sign-up-form.test.tsx`

- [ ] **Step 1: Update tests first**

In `tests/components/sign-up-form.test.tsx`, make these replacements:

| Old | New |
|-----|-----|
| `/End User License Agreement/i` (label query) | `/Terms of Service/i` |
| `href="/eula"` (link assertion) | `href="/terms"` |
| `/End User License Agreement.*EULA/i` (link name) | `/Terms of Service/i` |
| `/You must accept both the EULA and Privacy Policy/i` | `/You must accept both the Terms of Service and Privacy Policy/i` |

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/components/sign-up-form.test.tsx
```
Expected: FAIL on label, link, and error string assertions.

- [ ] **Step 3: Update component state key**

In `components/sign-up-form.tsx`, around line 51, change the state initialisation:

```ts
const [legalAgreements, setLegalAgreements] = useState({
  termsAccepted: false,
  privacyAccepted: false,
})
```

- [ ] **Step 4: Update all `eulaAccepted` references in the component**

Find all remaining uses of `eulaAccepted` in `sign-up-form.tsx` and replace with `termsAccepted`. Key locations:
- Line ~98: `if (!legalAgreements.termsAccepted || ...`
- Line ~106: `formData.append("termsAccepted", legalAgreements.termsAccepted.toString())`
- Line ~123: `const isFormValid = legalAgreements.termsAccepted && ...`
- Line ~254: `id="termsAccepted"` and `name="termsAccepted"`
- Line ~257: `checked={legalAgreements.termsAccepted}`
- Line ~262: update the `onChange` handler to use `termsAccepted`

- [ ] **Step 5: Update link and label text in component**

Around line 264–265:
```tsx
<label htmlFor="termsAccepted" className="text-sm text-gray-300 leading-5">
  I have read and agree to the{" "}
  <Link href="/terms" target="_blank" className="text-red-400 hover:text-red-300 underline">
    Terms of Service
  </Link>
```

Around line 291, update error message:
```tsx
You must accept both the Terms of Service and Privacy Policy to create an account.
```

- [ ] **Step 6: Run tests to verify they pass**

```
npx vitest run tests/components/sign-up-form.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add components/sign-up-form.tsx tests/components/sign-up-form.test.tsx
git commit -m "feat: update sign-up form EULA references to Terms of Service"
```

---

## Task 8: Update Login Form (TDD)

**Files:**
- Modify: `components/login-form.tsx`
- Modify: `tests/components/login-form.test.tsx`

- [ ] **Step 1: Update test first**

In `tests/components/login-form.test.tsx`, around line 189–192:

```ts
it("should render Terms of Service text", () => {
  // ...render setup...
  expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/components/login-form.test.tsx
```
Expected: FAIL — component still has "End User License Agreement".

- [ ] **Step 3: Update component**

In `components/login-form.tsx`, line ~211, replace the text. The exact phrase is:

```
By accessing or using this video platform, you agree to abide by our End User License Agreement.
```

Change to:

```
By accessing or using this video platform, you agree to abide by our Terms of Service.
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run tests/components/login-form.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/login-form.tsx tests/components/login-form.test.tsx
git commit -m "feat: update login form EULA reference to Terms of Service"
```

---

## Task 9: Full Test Suite Verification

- [ ] **Step 1: Run the full test suite**

```
npm test
```
Expected: all tests pass with no EULA/eula-related failures.

- [ ] **Step 2: Type-check and lint**

```
npm run type-check
npm run lint
```
Expected: no errors or warnings relating to changed files.

- [ ] **Step 3: If tests fail, investigate**

Common failure causes:
- A `eulaAccepted` reference missed in sign-up-form or auth action
- A test still querying by the old label text `/End User License Agreement/i`
- The `storeUserConsent` function still referencing the old column name

Fix, re-run, and commit any corrections before proceeding.

---

## Task 10: Final Commit and PR

- [ ] **Step 1: Verify branch state**

```bash
git log --oneline origin/main..HEAD
```
Expected: 9–10 commits, all on `feat/terms-privacy-rewrite`.

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/terms-privacy-rewrite
```

- [ ] **Step 3: Open PR**

```bash
gh pr create \
  --title "feat: Terms of Service rewrite, /terms route, and DB column rename" \
  --body "$(cat <<'EOF'
## Summary
- Replaces EULA with Terms of Service at `/terms`; `/eula` permanently redirects
- Full rewrite of both legal pages: comprehensive coverage of data, PII, infrastructure, GDPR, minors, Stripe
- Renames `user_consents.eula_accepted_at` → `terms_accepted_at` (migration 0013)
- Updates all references: footer, sign-up form, login form, middleware, tests

## Test plan
- [ ] All vitest tests pass (`npm test`)
- [ ] `/eula` redirects to `/terms` in browser
- [ ] `/terms` and `/privacy-policy` pages render correctly
- [ ] Sign-up flow: checkbox labels show "Terms of Service"; error message updated
- [ ] Login page: footer text updated
- [ ] Apply DB migration 0013 to Supabase before deploying

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

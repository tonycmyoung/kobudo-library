# Design: Terms of Service & Privacy Policy Rewrite

**Date:** 2026-05-02
**Status:** Approved for implementation

## Context

The kobudo-library platform currently has an EULA (`/eula`) and Privacy Policy (`/privacy-policy`) written by v0.app. Both documents need a full rewrite to match the quality, specificity, and legal coverage of the grading-panel-claude project's Terms of Service and Privacy Policy, which were written in May 2026 and serve as the prior-art baseline.

The consent-recording mechanism (registration checkboxes + `user_consents` table) is already in place and does not need to change — this is a content-only task.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Document name | "EULA" → "Terms of Service" |
| Route | New `/terms` page; redirect from `/eula`; update all references |
| International users | Yes — GDPR section required |
| Minors | Not currently tracked; responsibility sits with registering head teacher |
| Infrastructure | Supabase ap-southeast-2 (Sydney), Vercel — both named as data processors |
| Payments | Free platform; voluntary donations via Stripe; Stripe named as payment processor |
| Acceptance model | Explicit checkbox at registration (recorded with timestamp) + continued use = acceptance of updates |

---

## Terms of Service

**Route:** `/terms` (redirect from `/eula`)
**Last updated:** 2026-05-02

### Section Structure

#### 1. Acceptance
Access requires creating an account. During registration the user must explicitly accept these Terms by checking a confirmation box — registration is blocked without acceptance. Acceptance is recorded with a timestamp. Continued use after any update constitutes acceptance of the revised Terms.

#### 2. About the Service
Okinawa Kobudo Library is a private, approval-gated video library for authorised members, operated by TY Kobudo (sole trader, New South Wales, Australia). Contact: admin@tykobudo.com.au.

#### 3. Access & Registration
- Access is approval-gated; membership is not automatic on registration
- Users must provide accurate information: first/last name, email, school/dojo, teacher/sensei name
- Users are responsible for maintaining the security of their login credentials and must report unauthorised use immediately

#### 4. Permitted Use
A limited, non-exclusive, non-transferable, revocable licence to access and use the video library and associated materials for personal, non-commercial educational purposes as an authorised member.

#### 5. Restrictions
Users must not:
- Download, copy, screen-record, reproduce, republish, upload, or distribute any video content or platform materials
- Share account credentials with others
- Attempt to reverse-engineer, circumvent, or compromise the platform's security or access controls
- Use the platform or any content for commercial purposes

#### 6. Intellectual Property
All video, written, and photographic content is owned by TY Kobudo or licensed to TY Kobudo, and is protected by copyright and applicable laws. Use of the platform grants no ownership rights. Copyright © Tony Young. All rights reserved. No content may be reproduced or redistributed without explicit written permission.

#### 7. Recorded With Permission
All performances depicted in the platform's videos have been recorded and published with the explicit consent of the individuals featured.

#### 8. Minors
Membership is generally restricted to adults. A head teacher may register a member under 18 at their discretion; in that case, the head teacher is responsible for having obtained appropriate parental or guardian consent before registration. TY Kobudo does not verify member age.

#### 9. Free Service & Donations
The platform is currently free to access. Voluntary donations are supported via Stripe. Stripe processes donation payments under its own Terms of Service and Privacy Policy; TY Kobudo does not store card or payment details.

#### 10. Prohibited Conduct
Users must not:
- Attempt to access, alter, or delete another member's account or data
- Use automated tools to scrape or bulk-access the platform
- Interfere with or attempt to disrupt the operation of the platform
- Store or transmit content that violates applicable law

#### 11. Disclaimer of Warranties
The platform is provided as-is and as-available. TY Kobudo makes no warranties regarding uptime, content accuracy, or fitness for a particular purpose. The platform may be changed, suspended, or discontinued at any time without notice.

#### 12. Limitation of Liability
To the fullest extent permitted by law, TY Kobudo is not liable for any loss of data, loss of access, or indirect or consequential damages arising from use of or inability to use the platform. Nothing in these Terms excludes, restricts, or modifies rights that cannot be excluded under the Australian Consumer Law or any other applicable legislation.

#### 13. Indemnification
Users agree to indemnify and hold harmless TY Kobudo from any loss, liability, or claim arising from their violation of these Terms or misuse of the platform.

#### 14. Governing Law
These Terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the exclusive jurisdiction of the courts of New South Wales.

#### 15. Changes & Contact
TY Kobudo may update these Terms at any time. The "Last updated" date at the top reflects the current version. Continued use after an update constitutes acceptance. Questions: admin@tykobudo.com.au.

---

## Privacy Policy

**Route:** `/privacy-policy` (no route change)
**Last updated:** 2026-05-02

### Section Structure

#### 1. Who We Are
Okinawa Kobudo Library is operated by TY Kobudo, a sole-trader software business based in New South Wales, Australia. Contact: admin@tykobudo.com.au.

#### 2. What Data We Collect

| Data | Purpose |
|------|---------|
| First and last name | Identity and account management |
| Email address | Account access and communications |
| School/dojo affiliation | Membership verification |
| Teacher/sensei name | Membership verification |
| Belt/grade level (optional, if set by user) | Profile personalisation |
| Terms of Service and Privacy Policy acceptance timestamps | Consent recording |
| Browser type, device, and usage data | Platform improvement and analytics |
| Standard server request logs: IP address, request path, timestamp | Security monitoring and error diagnosis |

No payment card details are collected or stored by TY Kobudo. Donation payment data is processed directly by Stripe.

#### 3. How We Collect Your Information
- Registration form (name, email, school/dojo, teacher name)
- Profile settings (belt/grade level, if provided)
- Platform use (cookies, analytics, server logs)
- Communications via email or the platform

#### 4. How We Use Your Information
- Providing and managing access to the video library
- Maintaining and administering user accounts
- Recording consent at registration
- Communicating important updates or support information
- Improving and personalising your experience
- Complying with legal obligations

#### 5. Infrastructure & Data Processors
We do not sell personal data. We do not disclose personal data to third parties for marketing purposes.

To operate the platform, your data is processed by the following infrastructure providers acting as data processors:

| Provider | Role | Location |
|----------|------|----------|
| Supabase | Database — stores account and profile data | AWS ap-southeast-2, Sydney, Australia |
| Vercel | Hosting — processes standard web request logs | Global CDN |
| Stripe | Payment processing — handles voluntary donation payments | Subject to Stripe's Privacy Policy |

Supabase and Vercel do not use your data for their own purposes. Stripe processes only donation payment data and is not provided with other personal information. Each provider operates under their own Data Processing Agreement or Privacy Policy.

Data may also be disclosed to comply with legal obligations or in the event of a business transfer or merger.

#### 6. Data Storage & Sovereignty
Your account data is stored in Supabase's ap-southeast-2 region (Sydney, Australia). For Australian members, this means your data remains onshore. International members' data is also stored in Sydney; transfer protections appropriate to the destination country apply where required.

#### 7. Minors
Membership is generally restricted to adults. A head teacher may register a member under 18 at their discretion; in that case, the head teacher is responsible for having obtained appropriate parental or guardian consent before registration. TY Kobudo does not independently verify member age.

#### 8. Cookies & Tracking
The platform uses session and authentication cookies necessary for the service to function. Usage analytics may be collected to improve the platform. No advertising cookies, tracking pixels, or third-party analytics are used. You may disable cookies in your browser settings; some features may not function as a result.

#### 9. Data Retention
Data is retained while your account is active or as required by applicable law. To request deletion of your account and associated data, contact admin@tykobudo.com.au. Requests will be actioned within 30 days.

#### 10. Your Rights (Australian Users)
Under the Australian Privacy Act 1988 you may:
- Request access to personal information we hold about you
- Request correction of inaccurate or out-of-date information
- Request deletion of your data, subject to legal obligations
- Complain to the Office of the Australian Information Commissioner (oaic.gov.au) if you believe your privacy rights have been breached

To exercise any of these rights, contact admin@tykobudo.com.au.

#### 11. International Users & GDPR
This service is operated from Australia and is governed by Australian privacy law. If you are located in the European Union or European Economic Area, the General Data Protection Regulation (GDPR) may apply to you and may grant additional rights, including the right to data portability, the right to object to processing, and the right to lodge a complaint with your local supervisory authority.

EU/EEA residents may use the platform. Where GDPR applies, the lawful basis for processing your personal data is legitimate interests (operating a private educational platform for authorised members) and, where required, your explicit consent given at registration. We are not yet actively marketing to EU residents; before doing so, this Privacy Policy will be updated to fully address GDPR requirements including appointment of an EU representative where required.

#### 12. Changes & Contact
The "Last updated" date at the top of this page reflects the current version. We will post a notice when material changes are made.

Privacy enquiries and data deletion requests: admin@tykobudo.com.au
Office of the Australian Information Commissioner: oaic.gov.au

---

## Implementation Scope

### Files to create / modify

| Action | File | Notes |
|--------|------|-------|
| Create | `app/terms/page.tsx` | New Terms of Service page |
| Delete | `app/eula/page.tsx` | Replaced by `/terms` |
| Update | `next.config.mjs` | Add `redirects()` entry: `/eula` → `/terms` (permanent) |
| Rewrite | `app/privacy-policy/page.tsx` | Full content rewrite |
| Update | `components/legal-footer.tsx` | Link href `/eula` → `/terms`; label "EULA" → "Terms of Service" |
| Update | `components/sign-up-form.tsx` | Checkbox link href + label; error strings referencing "EULA" |
| Update | `components/login-form.tsx` | Contains "End User License Agreement" text — update to "Terms of Service" |
| Update | `lib/supabase/middleware.ts` | Add `/terms` to public route allowlist; `/eula` can be removed (redirect handled by next.config) |
| Update | `tests/components/legal-footer.test.tsx` | Update href and label text assertions |
| Update | `tests/components/sign-up-form.test.tsx` | Update href, label, and error string assertions |
| Update | `tests/unit/lib/actions/auth.test.ts` | Update error string assertion referencing "EULA" |
| Update | `tests/components/login-form.test.tsx` | Update "End User License Agreement" text assertion |

### Database schema
One migration required: rename `user_consents.eula_accepted_at` → `terms_accepted_at` for consistency with the renamed document. `privacy_accepted_at` is unchanged.

| Action | File | Detail |
|--------|------|--------|
| Create | `migrations/NNNN-rename-eula-to-terms.sql` | `ALTER TABLE user_consents RENAME COLUMN eula_accepted_at TO terms_accepted_at` |
| Update | `lib/actions/auth.tsx` | `storeUserConsent()` column reference |
| Update | `scripts/create_user_consents_table.sql` | Stale `eula_accepted_at` reference |
| Update | Any generated Supabase types | Files referencing `eula_accepted_at` |

### Out of scope
- Any change to the acceptance checkbox logic or `storeUserConsent()` function behaviour
- Analytics cookie consent banner (current analytics are session/auth cookies only — no third-party analytics in use)

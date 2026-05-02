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
                  </a>.
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

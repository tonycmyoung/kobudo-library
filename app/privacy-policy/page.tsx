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

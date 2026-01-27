import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated, 2026</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-foreground/80 leading-relaxed">
                By accessing or using GroundCTRL ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-foreground/80 leading-relaxed">
                GroundCTRL is a browser-based virtual satellite simulator designed for educational and training purposes. The Service provides:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                <li>Interactive satellite operations training simulations</li>
                <li>AI-assisted guidance through the Nova assistant</li>
                <li>Mission-based learning modules covering orbital mechanics, communications, and satellite subsystems</li>
                <li>Progress tracking and performance analytics</li>
                <li>Educational content related to satellite operations</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed mt-3">
                <strong>Important:</strong> GroundCTRL is a training simulator and does not control any actual satellites or spacecraft. All simulations are entirely virtual and for educational purposes only.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">3.1 Account Creation</h3>
                <p className="text-foreground/80 leading-relaxed">
                  To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">3.2 Account Security</h3>
                <p className="text-foreground/80 leading-relaxed">
                  You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">3.3 Age Requirements</h3>
                <p className="text-foreground/80 leading-relaxed">
                  You must be at least 13 years old to use the Service. If you are under 18, you represent that you have your parent or guardian's permission to use the Service.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p className="text-foreground/80 leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to develop competing products or services</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">5.1 Our Content</h3>
                <p className="text-foreground/80 leading-relaxed">
                  The Service and its original content, features, and functionality are owned by GroundCTRL and are by international copyright, trademark, patent, trade secret, and other intellectual property laws. This includes all simulation data, educational content, graphics, user interfaces, and software.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">5.2 Your Content</h3>
                <p className="text-foreground/80 leading-relaxed">
                  You retain ownership of any content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with operating and improving the Service.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Mission Points and Progress</h2>
              <p className="text-foreground/80 leading-relaxed">
                Mission Points (MP) and other virtual rewards earned through the Service have no monetary value and cannot be exchanged for cash or other consideration. We reserve the right to modify, suspend, or discontinue any rewards program at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Disclaimers</h2>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="text-foreground/80 leading-relaxed">
                  <strong>EDUCATIONAL PURPOSE ONLY:</strong> GroundCTRL is designed for educational and training purposes. The simulations are simplified representations and do not reflect actual satellite operations procedures used by space agencies or commercial operators.
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  <strong>NO REAL OPERATIONS:</strong> The Service does not provide control over any actual spacecraft, satellites, or space systems. Users should not rely on this training for actual satellite operations without additional professional training and certification.
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  <strong>AS-IS BASIS:</strong> THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p className="text-foreground/80 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, GROUNDCTRL AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Indemnification</h2>
              <p className="text-foreground/80 leading-relaxed">
                You agree to indemnify, defend, and hold harmless GroundCTRL and its affiliates from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the Service or your violation of these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">10. Termination</h2>
              <p className="text-foreground/80 leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease. You may also delete your account at any time through your account settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">11. Changes to Terms</h2>
              <p className="text-foreground/80 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on the Service and updating the "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">12. Governing Law</h2>
              <p className="text-foreground/80 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts of competent jurisdiction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">13. Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground font-medium">GroundCTRL Legal</p>
                <p className="text-muted-foreground">Email: legal@missionctrl.org</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

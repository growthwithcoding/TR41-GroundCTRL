import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated, 2026</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-foreground/80 leading-relaxed">
                Welcome to GroundCTRL ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our virtual satellite simulator platform and related services (collectively, the "Service"). Please read this privacy policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">2.1 Personal Information</h3>
                <p className="text-foreground/80 leading-relaxed">
                  When you create an account, we may collect:
                </p>
                <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Username and password</li>
                  <li>Profile information (optional)</li>
                  <li>Educational institution or organization (if applicable)</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">2.2 Usage Data</h3>
                <p className="text-foreground/80 leading-relaxed">
                  We automatically collect certain information when you access the Service:
                </p>
                <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                  <li>Mission progress and completion data</li>
                  <li>Simulator interaction logs and telemetry data</li>
                  <li>Learning analytics and performance metrics</li>
                  <li>Device information and browser type</li>
                  <li>IP address and general location data</li>
                  <li>Session duration and feature usage patterns</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-foreground/80 leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                <li>To provide, maintain, and improve the Service</li>
                <li>To personalize your learning experience and track progress</li>
                <li>To provide AI-assisted guidance through our Nova assistant</li>
                <li>To communicate with you about updates, features, and support</li>
                <li>To analyze usage patterns and improve simulator accuracy</li>
                <li>To ensure the security and integrity of the platform</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Data Sharing and Disclosure</h2>
              <p className="text-foreground/80 leading-relaxed">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our Service</li>
                <li><strong>Educational Institutions:</strong> If you access GroundCTRL through an educational program, we may share progress data with authorized administrators</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
              <p className="text-foreground/80 leading-relaxed">
                We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication protocols, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
              <p className="text-foreground/80 leading-relaxed">
                We retain your personal information for   account is active or  to provide you with the Service. You may request deletion of your account and associated data at any time by contacting us. Some information may be retained for legal or legitimate business purposes.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Your Rights</h2>
              <p className="text-foreground/80 leading-relaxed">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-foreground/80 space-y-1 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Children's Privacy</h2>
              <p className="text-foreground/80 leading-relaxed">
                GroundCTRL is designed for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately so we can delete such information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Changes to This Policy</h2>
              <p className="text-foreground/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service after any changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">10. Contact Us</h2>
              <p className="text-foreground/80 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground font-medium">GroundCTRL Support</p>
                <p className="text-muted-foreground">Email: privacy@missionctrl.org</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

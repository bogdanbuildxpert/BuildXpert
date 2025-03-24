import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto space-y-8 fade-in">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="prose prose-neutral max-w-none">
          <p>
            At BuildXpert, we take your privacy seriously. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information when you visit our website or use our platform.
          </p>

          <p>
            Please read this Privacy Policy carefully. If you do not agree with
            the terms of this Privacy Policy, please do not access the site.
          </p>

          <h2>1. Information We Collect</h2>

          <h3>1.1 Personal Data</h3>
          <p>
            We collect personal identification information from you in the
            following ways:
          </p>
          <ul>
            <li>When you register for an account</li>
            <li>When you post a job or service listing</li>
            <li>When you submit a contact form</li>
            <li>When you log in with Google authentication</li>
            <li>When you update your profile information</li>
          </ul>
          <p>The personal information we collect includes:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Address information</li>
            <li>Profile pictures (if provided)</li>
            <li>Professional credentials and experience</li>
            <li>Google account information (if using Google login)</li>
          </ul>

          <h3>1.2 Non-Personal Data</h3>
          <p>
            We also collect non-personal identification information about users
            when they interact with our site, including:
          </p>
          <ul>
            <li>Browser type and version</li>
            <li>Device type and screen size</li>
            <li>IP address</li>
            <li>Operating system</li>
            <li>Pages visited and navigation patterns</li>
            <li>Time and date of visits</li>
            <li>Referring website addresses</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>To create and manage your account</li>
            <li>To enable job posting and application features</li>
            <li>To facilitate communication between contractors and clients</li>
            <li>To improve our platform and user experience</li>
            <li>To send important notifications about our services</li>
            <li>To process and manage job listings</li>
            <li>To provide customer support</li>
            <li>To analyze usage patterns and improve our services</li>
            <li>To ensure platform security and prevent fraud</li>
          </ul>

          <h2>3. Cookies and Tracking Technologies</h2>
          <p>
            Our website uses cookies and similar tracking technologies to
            enhance your browsing experience. These include:
          </p>
          <ul>
            <li>
              <strong>Essential Cookies:</strong> Required for basic site
              functionality (e.g., authentication, session management)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how
              visitors use our site (e.g., Google Analytics)
            </li>
            <li>
              <strong>Preference Cookies:</strong> Remember your settings and
              choices
            </li>
          </ul>
          <p>
            You can control cookie preferences through our cookie consent
            manager and your browser settings. Note that disabling certain
            cookies may affect site functionality.
          </p>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your
            information:
          </p>
          <ul>
            <li>Secure SSL/TLS encryption for all data transmission</li>
            <li>Regular security assessments and updates</li>
            <li>Restricted access to personal information</li>
            <li>Secure password hashing and storage</li>
            <li>Regular backups and data recovery procedures</li>
          </ul>

          <h2>5. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li>Google Analytics for website analytics</li>
            <li>Google Authentication for user login</li>
            <li>Supabase for data storage</li>
          </ul>
          <p>
            These services have their own privacy policies and data handling
            practices. We encourage you to review their respective privacy
            policies.
          </p>

          <h2>6. Your Rights</h2>
          <p>Under GDPR and applicable data protection laws, you have:</p>
          <ul>
            <li>The right to access your personal data</li>
            <li>The right to correct inaccurate data</li>
            <li>The right to request data deletion</li>
            <li>The right to restrict data processing</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information in
            the Contact section.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to
            provide our services and fulfill the purposes outlined in this
            policy. You can request deletion of your account and associated data
            at any time.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our service is not directed to anyone under 18. We do not knowingly
            collect personal information from children. If you believe we have
            collected information from a minor, please contact us immediately.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. The latest version
            will always be posted on this page with the effective date. We
            encourage you to review this policy regularly.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or your personal data,
            contact us at:
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:bogdan@buildxpert.ie">bogdan@buildxpert.ie</a>
            <br />
            <strong>Phone:</strong>{" "}
            <a href="tel:+353838329361">+353 83 832 9361</a>
            <br />
            <strong>Address:</strong>
            <br />
            UNIT 4 FIRST FLOOR
            <br />
            84 STRAND STREET
            <br />
            SKERRIES, DUBLIN
            <br />
            K34VW93
            <br />
            Ireland
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            By using the BuildXpert platform, you consent to our Privacy Policy
            and agree to its terms.
          </p>
          <div className="mt-4">
            <Link
              href="/terms"
              className="text-sm text-primary hover:underline"
            >
              View our Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

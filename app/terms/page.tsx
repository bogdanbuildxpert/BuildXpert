import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto space-y-8 fade-in">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
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
            Welcome to BuildXpert. These Terms of Service (&quot;Terms&quot;)
            govern your use of the BuildXpert website, services, and platform
            (collectively, the &quot;Service&quot;) operated by BuildXpert
            (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
          </p>

          <p>
            By accessing or using the Service, you agree to be bound by these
            Terms. If you disagree with any part of the Terms, you may not
            access the Service.
          </p>

          <h2>1. Use of Service</h2>
          <p>
            BuildXpert provides a platform connecting professional painting
            contractors with clients seeking painting services for construction
            projects. Our Service includes job posting, contractor profiles,
            service listings, and communication tools.
          </p>

          <h3>1.1 Account Registration</h3>
          <p>
            To access certain features of the Service, you may be required to
            register for an account. You agree to provide accurate, current, and
            complete information during the registration process and to update
            such information to keep it accurate, current, and complete.
          </p>

          <h3>1.2 Account Security</h3>
          <p>
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password. You agree not to disclose your password to any third
            party. You must notify us immediately upon becoming aware of any
            breach of security or unauthorized use of your account.
          </p>

          <h2>2. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise
            make available certain information, text, graphics, videos, or other
            material ("User Content"). You are responsible for the User Content
            that you post on or through the Service, including its legality,
            reliability, and appropriateness.
          </p>

          <h3>2.1 Content License</h3>
          <p>
            By posting User Content on or through the Service, you grant us the
            right to use, modify, publicly perform, publicly display, reproduce,
            and distribute such content on and through the Service. You retain
            any and all of your rights to any User Content you submit, post, or
            display on or through the Service and you are responsible for
            protecting those rights.
          </p>

          <h3>2.2 Content Restrictions</h3>
          <p>You agree not to post User Content that:</p>
          <ul>
            <li>Is false, inaccurate, or misleading</li>
            <li>
              Infringes on any patent, trademark, trade secret, copyright, or
              other intellectual property rights
            </li>
            <li>
              Violates the legal rights (including the rights of publicity and
              privacy) of others or contains any material that could give rise
              to civil or criminal liability
            </li>
            <li>
              Is illegal, obscene, defamatory, threatening, pornographic,
              harassing, hateful, racially or ethnically offensive
            </li>
            <li>
              Contains software viruses or any other computer code designed to
              interrupt, destroy, or limit the functionality of any computer
              software or hardware
            </li>
          </ul>

          <h2>3. Service Fees</h2>
          <p>
            Certain aspects of the Service may be subject to fees. You agree to
            pay all fees and charges incurred in connection with your use of the
            Service. All fees are non-refundable unless expressly stated
            otherwise.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The Service and its original content (excluding User Content),
            features, and functionality are and will remain the exclusive
            property of BuildXpert and its licensors. The Service is protected
            by copyright, trademark, and other laws of both the United States
            and foreign countries. Our trademarks and trade dress may not be
            used in connection with any product or service without the prior
            written consent of BuildXpert.
          </p>

          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the
            Service immediately, without prior notice or liability, under our
            sole discretion, for any reason whatsoever and without limitation,
            including but not limited to a breach of the Terms.
          </p>
          <p>
            If you wish to terminate your account, you may simply discontinue
            using the Service or contact us to request account deletion.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall BuildXpert, nor its directors, employees,
            partners, agents, suppliers, or affiliates, be liable for any
            indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill,
            or other intangible losses, resulting from:
          </p>
          <ul>
            <li>
              Your access to or use of or inability to access or use the Service
            </li>
            <li>Any conduct or content of any third party on the Service</li>
            <li>Any content obtained from the Service</li>
            <li>
              Unauthorized access, use, or alteration of your transmissions or
              content
            </li>
          </ul>

          <h2>7. Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is
            provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
            The Service is provided without warranties of any kind, whether
            express or implied, including, but not limited to, implied
            warranties of merchantability, fitness for a particular purpose,
            non-infringement, or course of performance.
          </p>
          <p>
            BuildXpert does not warrant that: (a) the Service will function
            uninterrupted, secure, or available at any particular time or
            location; (b) any errors or defects will be corrected; (c) the
            Service is free of viruses or other harmful components; or (d) the
            results of using the Service will meet your requirements.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the
            laws of the United States, without regard to its conflict of law
            provisions.
          </p>
          <p>
            Our failure to enforce any right or provision of these Terms will
            not be considered a waiver of those rights. If any provision of
            these Terms is held to be invalid or unenforceable by a court, the
            remaining provisions of these Terms will remain in effect.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material, we will provide
            at least 30 days&apos; notice prior to any new terms taking effect.
            What constitutes a material change will be determined at our sole
            discretion.
          </p>
          <p>
            By continuing to access or use our Service after any revisions
            become effective, you agree to be bound by the revised terms. If you
            do not agree to the new terms, you are no longer authorized to use
            the Service.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> support@buildxpert.com
            <br />
            <strong>Phone:</strong> (555) 123-4567
            <br />
            <strong>Address:</strong> 123 Construction Way, Suite 100, Building
            City, BC 12345
          </p>
        </div>

        <div className="border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            By using the BuildXpert platform, you acknowledge that you have read
            and understood these Terms of Service and agree to be bound by them.
          </p>
          <div className="mt-4">
            <Link
              href="/privacy"
              className="text-sm text-primary hover:underline"
            >
              View our Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

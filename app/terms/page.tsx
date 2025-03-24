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
            govern your use of the BuildXpert website and platform
            (collectively, the &quot;Service&quot;) operated by BuildXpert
            (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), located at
            UNIT 4 FIRST FLOOR, 84 STRAND STREET, SKERRIES, DUBLIN, K34VW93,
            Ireland.
          </p>

          <p>
            By accessing or using the Service, you agree to be bound by these
            Terms. If you disagree with any part of the Terms, you may not
            access the Service.
          </p>

          <h2>1. Service Description</h2>
          <p>
            BuildXpert provides an online platform connecting professional
            painting contractors with clients seeking painting services for
            construction projects in Ireland. Our services include:
          </p>
          <ul>
            <li>Job posting and management</li>
            <li>Contractor profiles and portfolios</li>
            <li>Project communication tools</li>
            <li>Quote request and submission system</li>
            <li>Project scheduling and management tools</li>
          </ul>

          <h2>2. User Accounts</h2>

          <h3>2.1 Account Creation</h3>
          <p>
            You can create an account either through direct registration or
            Google Authentication. When registering, you must provide accurate,
            current, and complete information. You are responsible for
            maintaining the confidentiality of your account credentials.
          </p>

          <h3>2.2 Account Types</h3>
          <p>We offer two types of accounts:</p>
          <ul>
            <li>
              <strong>Client Accounts:</strong> For individuals or businesses
              seeking painting services
            </li>
            <li>
              <strong>Contractor Accounts:</strong> For professional painting
              contractors offering services
            </li>
          </ul>

          <h3>2.3 Account Security</h3>
          <p>
            You are responsible for all activities under your account. You must:
          </p>
          <ul>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Not share your account credentials with any third party</li>
            <li>Ensure you log out from your account on shared devices</li>
          </ul>

          <h2>3. User Content</h2>
          <p>
            When posting content on our platform (including job listings,
            profiles, and messages), you:
          </p>
          <ul>
            <li>
              Retain ownership of your content but grant us a license to use,
              modify, and display it
            </li>
            <li>
              Are responsible for ensuring your content is accurate and legal
            </li>
            <li>Must not post false, misleading, or fraudulent information</li>
            <li>
              Must not infringe on others&apos; intellectual property rights
            </li>
          </ul>

          <h2>4. Platform Rules</h2>
          <p>Users of our platform must not:</p>
          <ul>
            <li>Post false or misleading information</li>
            <li>Harass or discriminate against other users</li>
            <li>Attempt to circumvent our platform fees</li>
            <li>Create multiple accounts for the same service</li>
            <li>Use the platform for any illegal activities</li>
            <li>
              Attempt to scrape or collect data from our platform without
              permission
            </li>
          </ul>

          <h2>5. Fees and Payments</h2>
          <p>Our fee structure and payment terms are as follows:</p>
          <ul>
            <li>All fees are clearly displayed before any transaction</li>
            <li>Payments are processed through secure payment providers</li>
            <li>Fees are non-refundable unless otherwise stated</li>
            <li>
              We reserve the right to modify our fee structure with notice
            </li>
          </ul>

          <h2>6. Termination</h2>
          <p>We may suspend or terminate your account if you:</p>
          <ul>
            <li>Violate these Terms of Service</li>
            <li>Provide false information</li>
            <li>Engage in fraudulent activity</li>
            <li>Fail to pay applicable fees</li>
            <li>Receive repeated negative feedback or complaints</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service, including its original content (excluding User
            Content), features, and functionality, is owned by BuildXpert and
            protected by international copyright, trademark, and other
            intellectual property laws.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law:</p>
          <ul>
            <li>
              We provide the service &quot;as is&quot; without any warranties
            </li>
            <li>
              We are not liable for any indirect, incidental, or consequential
              damages
            </li>
            <li>
              Our liability is limited to the amount you paid us in the past 12
              months
            </li>
            <li>We are not responsible for disputes between users</li>
          </ul>

          <h2>9. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or the Service will be
            resolved according to Irish law. You agree to:
          </p>
          <ul>
            <li>First attempt to resolve disputes informally</li>
            <li>Submit to the exclusive jurisdiction of Irish courts</li>
            <li>Waive any right to participate in class action lawsuits</li>
          </ul>

          <h2>10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. We will notify you of any
            material changes by:
          </p>
          <ul>
            <li>Posting a notice on our website</li>
            <li>Sending an email to registered users</li>
            <li>Providing at least 30 days notice for material changes</li>
          </ul>
          <p>
            Your continued use of the Service after changes become effective
            constitutes acceptance of the updated Terms.
          </p>

          <h2>11. Contact Information</h2>
          <p>For questions about these Terms, please contact us at:</p>
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

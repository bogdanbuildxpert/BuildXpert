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
            We may collect personal identification information from you in a
            variety of ways, including, but not limited to, when you:
          </p>
          <ul>
            <li>Register for an account</li>
            <li>Post a job or service</li>
            <li>Submit a quote request</li>
            <li>Fill out a contact form</li>
            <li>Subscribe to a newsletter</li>
          </ul>
          <p>The personal information we may collect includes:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Mailing address</li>
            <li>Payment information</li>
            <li>Professional credentials and experience</li>
          </ul>

          <h3>1.2 Non-Personal Data</h3>
          <p>
            We may also collect non-personal identification information about
            users whenever they interact with our site. This may include:
          </p>
          <ul>
            <li>Browser name</li>
            <li>Type of computer or device</li>
            <li>
              Technical information about users&apos; connection to our site
            </li>
            <li>IP address</li>
            <li>Referring site</li>
            <li>Pages visited</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We may use the information we collect from you for the following
            purposes:
          </p>
          <ul>
            <li>To operate and maintain our platform</li>
            <li>To improve user experience</li>
            <li>To connect contractors with clients</li>
            <li>To process transactions</li>
            <li>To send periodic emails and notifications</li>
            <li>To respond to inquiries and customer service requests</li>
            <li>To administer promotions, surveys, or other site features</li>
            <li>To analyze usage patterns and improve our services</li>
          </ul>

          <h2>3. How We Protect Your Information</h2>
          <p>
            We adopt appropriate data collection, storage, and processing
            practices and security measures to protect against unauthorized
            access, alteration, disclosure, or destruction of your personal
            information, username, password, transaction information, and data
            stored on our site.
          </p>
          <p>
            Sensitive and private data exchange between the site and its users
            happens over an SSL secured communication channel and is encrypted
            and protected with digital signatures.
          </p>

          <h2>4. Sharing Your Personal Information</h2>
          <p>
            We do not sell, trade, or rent users' personal identification
            information to others. We may share generic aggregated demographic
            information not linked to any personal identification information
            regarding visitors and users with our business partners, trusted
            affiliates, and advertisers.
          </p>
          <p>
            We may use third-party service providers to help us operate our
            business and the site or administer activities on our behalf, such
            as sending out newsletters or surveys. We may share your information
            with these third parties for those limited purposes.
          </p>

          <h2>5. Third-Party Websites</h2>
          <p>
            Users may find content on our site that links to the sites and
            services of our partners, suppliers, advertisers, sponsors,
            licensors, and other third parties. We do not control the content or
            links that appear on these sites and are not responsible for the
            practices employed by websites linked to or from our site.
          </p>
          <p>
            Browsing and interaction on any other website, including websites
            which have a link to our site, is subject to that website&apos;s own
            terms and policies.
          </p>

          <h2>6. Cookies and Tracking Technologies</h2>
          <p>
            Our site may use &quot;cookies&quot; to enhance user experience.
            User&apos;s web browser places cookies on their hard drive for
            record-keeping purposes and sometimes to track information about
            them. Users may choose to set their web browser to refuse cookies or
            to alert you when cookies are being sent. If they do so, note that
            some parts of the site may not function properly.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            Our service is not directed to anyone under the age of 18. We do not
            knowingly collect personal information from children under 18. If
            you are a parent or guardian and you are aware that your child has
            provided us with personal information, please contact us so that we
            can take necessary actions.
          </p>

          <h2>8. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding
            your personal information, including:
          </p>
          <ul>
            <li>
              The right to access the personal information we have about you
            </li>
            <li>
              The right to request correction of inaccurate personal information
            </li>
            <li>The right to request deletion of your personal information</li>
            <li>
              The right to object to processing of your personal information
            </li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information
            provided in the "Contact Us" section.
          </p>

          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            BuildXpert has the discretion to update this Privacy Policy at any
            time. When we do, we will revise the updated date at the top of this
            page. We encourage users to frequently check this page for any
            changes to stay informed about how we are helping to protect the
            personal information we collect.
          </p>
          <p>
            You acknowledge and agree that it is your responsibility to review
            this Privacy Policy periodically and become aware of modifications.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, the practices
            of this site, or your dealings with this site, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> privacy@buildxpert.com
            <br />
            <strong>Phone:</strong> (555) 123-4567
            <br />
            <strong>Address:</strong> 123 Construction Way, Suite 100, Building
            City, BC 12345
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

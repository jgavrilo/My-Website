import React from 'react';
import LegalLayout from '../../components/layout/LegalLayout';

const JgAppTerms: React.FC = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      documentTitle="JG App Terms of Service | Jeremy Gavrilov"
      lastUpdated="August 25, 2026"
    >
      <p>
        JG App (“the App”) is operated by Jeremy Gavrilov (“we,” “us”).
      </p>
      <p>
        These terms govern your use of the App. Last updated: August 25, 2026.
      </p>
      <p>
        By downloading or using the App, you agree to these terms. If you do not agree, do
        not use the App.
      </p>

      <h2>What the App is</h2>
      <p>
        JG App is a software engineering portfolio. It shows public content such as an about
        section, resume, project demos, links, and contact details. It does not require an
        account.
      </p>
      <p>
        The App is provided for personal, non-commercial viewing of that portfolio content.
      </p>

      <h2>Your use of the App</h2>
      <p>You may use the App as it is provided on your own device. You may not:</p>
      <ul>
        <li>Copy, reverse engineer, or redistribute the App except as allowed by applicable law</li>
        <li>Attempt to disrupt, overload, or gain unauthorized access to the App or its infrastructure</li>
        <li>Use the App for any unlawful purpose</li>
      </ul>

      <h2>Content</h2>
      <p>
        Portfolio content in the App (text, images, demos, links, and related media) is owned
        by Jeremy Gavrilov or used with permission. Viewing it in the App does not transfer
        any ownership or license beyond the right to use the App as described here.
      </p>
      <p>
        Some content is loaded from Google Firebase so it can stay up to date. We may add,
        change, or remove content at any time.
      </p>

      <h2>Third-party services and links</h2>
      <p>The App may open:</p>
      <ul>
        <li>External websites</li>
        <li>A resume or other PDF</li>
        <li>Maps (when you tap an address)</li>
        <li>Phone (when you tap a phone number)</li>
      </ul>
      <p>
        Those destinations are not controlled by us. Their own terms and privacy policies
        apply. We are not responsible for third-party sites, apps, or services.
      </p>
      <p>
        Firebase and Apple (and, on Android, Google) may be used to deliver content or
        optional push notifications. Their terms apply to those services.
      </p>

      <h2>Notifications</h2>
      <p>
        Push notifications are off unless you turn them on. You can disable them in the App
        or in your device settings at any time.
      </p>

      <h2>Privacy</h2>
      <p>
        How the App handles information is described in the{' '}
        <a href="/jg-app/privacy">Privacy Policy</a>.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The App is provided “as is” and “as available,” without warranties of any kind,
        whether express or implied, including merchantability, fitness for a particular
        purpose, and non-infringement.
      </p>
      <p>
        We do not warrant that the App will be uninterrupted, error-free, or free of harmful
        components, or that content will always be current or complete.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Jeremy Gavrilov is not liable for any
        indirect, incidental, special, consequential, or punitive damages, or any loss of
        data, profits, or goodwill, arising from your use of the App.
      </p>
      <p>
        Our total liability for any claim related to the App will not exceed the amount you
        paid to download it (if any).
      </p>
      <p>
        Some jurisdictions do not allow certain limitations, so some of the above may not
        apply to you.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The “Last updated” date at the top will change when we
        do. Continued use of the App after an update means you accept the revised terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to Jeremy Gavrilov using the contact details
        shown in the App (About tab), or by opening an issue on the App’s GitHub repository:{' '}
        <a href="https://github.com/jgavrilo/Jeremy-Gavrilov-App" target="_blank" rel="noopener noreferrer">
          github.com/jgavrilo/Jeremy-Gavrilov-App
        </a>.
      </p>
    </LegalLayout>
  );
};

export default JgAppTerms;

import React from 'react';
import LegalLayout from '../../components/layout/LegalLayout';

const JgAppPrivacy: React.FC = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      documentTitle="JG App Privacy Policy | Jeremy Gavrilov"
      lastUpdated="August 25, 2026"
    >
      <p>
        JG App (“the App”) is operated by Jeremy Gavrilov (“we,” “us”).
      </p>
      <p>
        This policy describes how the App handles information. Last updated: August 25, 2026.
      </p>
      <p>
        JG App is a software engineering portfolio. It shows public content such as an about
        section, resume, project demos, links, and contact details. It does not require an
        account and does not ask you to submit personal information.
      </p>

      <h2>Information we do not collect</h2>
      <p>We do not:</p>
      <ul>
        <li>Create user accounts or require a login</li>
        <li>Ask for your name, email, phone number, photos, or payment information</li>
        <li>Show ads or use advertising identifiers (IDFA)</li>
        <li>Sell, rent, or share personal information with third parties for marketing</li>
      </ul>

      <h2>Information processed when you use the App</h2>

      <h3>Public content</h3>
      <p>
        The App loads public portfolio content (about information, demos, links, contact
        details, and related media) from <strong>Google Firebase Realtime Database</strong>.
        That content is published by us. Using the App sends standard technical requests to
        Firebase so the content can be displayed and kept up to date.
      </p>
      <p>
        Google may process technical data such as IP address, device information, and request
        logs as part of providing that infrastructure. See{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google’s Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
          Firebase Privacy and Security
        </a>.
      </p>

      <h3>On-device preferences</h3>
      <p>
        If you change settings in the App (for example, the push notification toggle), that
        preference is stored locally on your device. It is not uploaded to our servers.
      </p>

      <h3>Push notifications (optional)</h3>
      <p>
        Push notifications are off unless you turn them on. If you enable them, the App
        requests notification permission from your device. A device push token may be used by
        Apple (and, on Android, Google) to deliver alerts we send, such as new demos or
        announcements.
      </p>
      <p>
        You can turn notifications off in the App or in your device settings. That does not
        affect other App features.
      </p>

      <h3>Links and system features you choose to open</h3>
      <p>Some screens let you open:</p>
      <ul>
        <li>External websites (in an in-app browser)</li>
        <li>A resume or other PDF</li>
        <li>Maps (when you tap an address)</li>
        <li>Phone (when you tap a phone number)</li>
      </ul>
      <p>
        Those actions are initiated by you. The destination site, Maps, or Phone app is
        governed by its own terms and privacy policy, not this one.
      </p>

      <h2>Children’s privacy</h2>
      <p>
        The App is not directed at children under 13, and we do not knowingly collect
        personal information from children.
      </p>

      <h2>Data retention</h2>
      <p>
        We do not maintain user accounts or a personal-data profile about you. Local
        preferences remain on your device until you delete the App or clear its data.
        Technical logs held by Google/Firebase are retained according to their policies.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Use the App without enabling notifications</li>
        <li>Disable notifications later in Settings or in system settings</li>
        <li>Delete the App to remove locally stored preferences</li>
        <li>Contact us (below) with privacy questions or requests</li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update this policy if the App’s practices change. The “Last updated” date at
        the top will change when we do. Continued use of the App after an update means you
        accept the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or the App’s privacy practices can be sent to Jeremy
        Gavrilov using the contact details shown in the App (About tab), or by opening an
        issue on the App’s GitHub repository:{' '}
        <a href="https://github.com/jgavrilo/Jeremy-Gavrilov-App" target="_blank" rel="noopener noreferrer">
          github.com/jgavrilo/Jeremy-Gavrilov-App
        </a>.
      </p>
    </LegalLayout>
  );
};

export default JgAppPrivacy;

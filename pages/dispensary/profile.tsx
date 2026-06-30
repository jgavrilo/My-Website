import { useState, useId } from 'react';
import { User } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import styles from '../../styles/dispensary/Dispensary.module.css';

export const getServerSideProps = withDispensaryAuth();

export default function ProfilePage({ user }: { user: AuthUser }) {
  const formId = useId();

  const [profile, setProfile] = useState({
    displayName: user.name,
    email: user.email,
    role: 'owner',
    orgName: '',
    phone: '',
  });

  // Org setup — slug is what shows as the key in Firebase
  const [orgName,    setOrgName]    = useState(user.orgSlug === user.uid ? '' : user.orgSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
  const [orgSaving,  setOrgSaving]  = useState(false);
  const [orgSaved,   setOrgSaved]   = useState(false);
  const [orgError,   setOrgError]   = useState('');

  const [passwords, setPasswords] = useState({
    current: '', next: '', confirm: '',
  });

  const [profileSaved,  setProfileSaved]  = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');


  function saveProfile() {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function saveOrgName() {
    setOrgError('');
    if (!orgName.trim()) { setOrgError('Enter your organization name.'); return; }
    setOrgSaving(true);
    try {
      const res = await fetch('/api/dispensary/profile/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orgName: orgName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setOrgError(d.error ?? 'Failed to save.');
        return;
      }
      setOrgSaved(true);
      setTimeout(() => {
        // Hard reload so withAuth re-reads the new orgSlug from the database
        window.location.reload();
      }, 800);
    } catch {
      setOrgError('Network error. Try again.');
    } finally {
      setOrgSaving(false);
    }
  }

  function savePassword() {
    setPasswordError('');
    if (!passwords.current) { setPasswordError('Enter your current password.'); return; }
    if (passwords.next.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (passwords.next !== passwords.confirm) { setPasswordError('Passwords do not match.'); return; }
    setPasswords({ current: '', next: '', confirm: '' });
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  return (
    <DispensaryLayout title="Profile &amp; Settings" user={user} unread={2}>
      <div className={styles.maxWidth480}>

        {/* ── Organization ── */}
        <div className={styles.card} style={{ marginBottom: '1rem' }} id="organization">
          <h2 className={styles.sectionLabel}>Organization</h2>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 1rem' }}>
            This name is used as your identifier in the database.
            {user.orgSlug !== user.uid && (
              <> Current slug: <code style={{ color: '#6dc898', fontFamily: 'monospace' }}>{user.orgSlug}</code></>
            )}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className={styles.field}>
              <label>Organization / dispensary name</label>
              <input
                value={orgName}
                placeholder="e.g. Green State Market"
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            {orgError && <p className={styles.loginError}>{orgError}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={saveOrgName}
                disabled={orgSaving || !orgName.trim()}
              >
                {orgSaving ? 'Saving…' : 'Save Organization'}
              </button>
              {orgSaved && <span className={styles.savedText}>Saved! Refreshing…</span>}
            </div>
          </div>
        </div>

        {/* ── Profile ── */}
        <div className={styles.card} style={{ marginBottom: '1rem' }} id="profile">
          <h2 className={styles.sectionLabel}>Profile</h2>

          <div className={styles.profileAvatar} style={{ marginBottom: '1.25rem' }}>
            <div className={styles.avatarCircle}>
              <User size={24} strokeWidth={1.5} />
            </div>
            <div>
              <div className={styles.avatarName}>{profile.displayName}</div>
              <div className={styles.avatarEmail}>{profile.email}</div>
              <div className={styles.avatarRole}>{profile.role}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className={styles.field}>
              <label htmlFor={`${formId}-name`}>Display name</label>
              <input id={`${formId}-name`} value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
            </div>

            <div className={styles.field}>
              <label htmlFor={`${formId}-email`}>Email</label>
              <input id={`${formId}-email`} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>

            <div className={styles.field}>
              <label htmlFor={`${formId}-org`}>Organization name</label>
              <input id={`${formId}-org`} value={profile.orgName} onChange={(e) => setProfile({ ...profile, orgName: e.target.value })} />
            </div>

            <div className={styles.field}>
              <label htmlFor={`${formId}-phone`}>Phone</label>
              <input id={`${formId}-phone`} type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveProfile}>
                Save Profile
              </button>
              {profileSaved && <span className={styles.savedText}>Saved!</span>}
            </div>
          </div>
        </div>

        {/* ── Password ── */}
        <div className={styles.card} style={{ marginBottom: '1rem' }} id="security">
          <h2 className={styles.sectionLabel}>Change Password</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className={styles.field}>
              <label>Current password</label>
              <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
            </div>
            <div className={styles.field}>
              <label>New password</label>
              <input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} placeholder="Min. 8 characters" />
            </div>
            <div className={styles.field}>
              <label>Confirm new password</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Repeat new password" />
            </div>

            {passwordError && <p className={styles.loginError}>{passwordError}</p>}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={savePassword}>
                Update Password
              </button>
              {passwordSaved && <span className={styles.savedText}>Password updated!</span>}
            </div>
          </div>
        </div>

        {/* ── Settings ── */}
        <div className={styles.card} id="settings">
          <h2 className={styles.sectionLabel}>Settings</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Email alerts — TODO */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#fff' }}>Email alerts</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Get notified about billing and system events.
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', flexShrink: 0 }}>
                TODO
              </span>
            </div>

            <hr className={styles.divider} />

            {/* 2FA — TODO */}
            <div style={{ padding: '0.625rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Two-factor authentication</div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                  TODO
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
                Add an extra layer of security to your account.
              </div>
            </div>
          </div>
        </div>

      </div>
    </DispensaryLayout>
  );
}

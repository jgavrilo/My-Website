'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, MapPin, Tag, Bell, Inbox,
  CreditCard, User, LogOut, Settings, ChevronDown, Link2,
} from 'lucide-react';
import type { AuthUser } from '../../lib/dispensary/withAuth';
import styles from '../../styles/dispensary/Dispensary.module.css';

const NAV_BASE = [
  { href: '/dispensary/dashboard',           icon: LayoutDashboard, label: 'Dashboard'          },
  { href: '/dispensary/deals',               icon: Tag,             label: 'Deals'               },
  { href: '/dispensary/links',               icon: Link2,           label: 'Links'               },
  { href: '/dispensary/notifications',       icon: Bell,            label: 'Push Notifications'  },
  { href: '/dispensary/notification-center', icon: Inbox,           label: 'Notification Center' },
];

interface Props {
  children: React.ReactNode;
  title: string;
  user: AuthUser;
  unread?: number;
}

export default function DispensaryLayout({ children, title, user, unread = 0 }: Props) {
  const { pathname } = useRouter();
  const [userOpen, setUserOpen] = useState(false);

  const locationsEntry = {
    href:  '/dispensary/locations',
    icon:  MapPin,
    label: user.plan === 'starter' ? 'Store Information' : 'Locations',
  };
  const NAV = [NAV_BASE[0], locationsEntry, ...NAV_BASE.slice(1)];

  const initials = user.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>D</div>
          <span className={styles.sidebarOrgName}>Dispensary Portal</span>
        </div>

        {/* Nav */}
        <nav className={styles.sidebarNav}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              >
                <Icon size={16} strokeWidth={1.75} className={styles.navIcon} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={styles.sidebarFooter}>
          <button
            className={styles.userMenu}
            onClick={() => setUserOpen((v) => !v)}
          >
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.email}</span>
            </div>
            <ChevronDown
              size={13}
              className={`${styles.chevron} ${userOpen ? styles.chevronOpen : ''}`}
            />
          </button>

          {userOpen && (
            <div className={styles.userDropdown}>
              <Link
                href="/dispensary/profile"
                className={styles.dropdownItem}
                onClick={() => setUserOpen(false)}
              >
                <User size={13} /> Profile
              </Link>
              <Link
                href="/dispensary/billing"
                className={styles.dropdownItem}
                onClick={() => setUserOpen(false)}
              >
                <CreditCard size={13} /> Billing
              </Link>
              <Link
                href="/dispensary/profile#settings"
                className={styles.dropdownItem}
                onClick={() => setUserOpen(false)}
              >
                <Settings size={13} /> Settings
              </Link>
              <div className={styles.dropdownDivider} />
              <form action="/api/dispensary/auth/signout" method="POST">
                <button type="submit" className={`${styles.dropdownItem} ${styles.dropdownDanger}`}>
                  <LogOut size={13} /> Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>{title}</h1>
          <div className={styles.headerActions}>
            <Link
              href="/dispensary/notification-center"
              className={styles.bellButton}
              title="Notification Center"
            >
              <Bell size={16} strokeWidth={1.75} />
              {unread > 0 && <span className={styles.bellBadge} />}
            </Link>
          </div>
        </header>

        <div className={styles.pageBody}>
          {children}
        </div>
      </div>
    </div>
  );
}

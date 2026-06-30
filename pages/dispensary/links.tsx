import { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import {
  Link2, Plus, ChevronRight, Loader2, ExternalLink,
  Globe, Camera, Users, Mail, Phone,
  FileText, ShoppingBag, MapPin, Calendar, Music, Star,
  Leaf, Package, AtSign, Code, Briefcase, Play,
  BookOpen, MessageCircle, Video, Rss, Mic, Image,
  Heart, Zap, Store, Hash, type LucideIcon,
} from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb } from '../../lib/dispensary/firebase/client';
import styles from '../../styles/dispensary/Dispensary.module.css';

// ── Icon registry ──────────────────────────────────────────────────────────

const ICON_OPTIONS: { id: string; label: string; component: LucideIcon }[] = [
  { id: 'Globe',         label: 'Website',      component: Globe         },
  { id: 'Camera',        label: 'Instagram',    component: Camera        },
  { id: 'Users',         label: 'Facebook',     component: Users         },
  { id: 'AtSign',        label: 'X / Twitter',  component: AtSign        },
  { id: 'Play',          label: 'YouTube',      component: Play          },
  { id: 'Video',         label: 'TikTok',       component: Video         },
  { id: 'Briefcase',     label: 'LinkedIn',     component: Briefcase     },
  { id: 'Code',          label: 'GitHub',       component: Code          },
  { id: 'Mic',           label: 'Podcast',      component: Mic           },
  { id: 'Music',         label: 'Music',        component: Music         },
  { id: 'Image',         label: 'Photos',       component: Image         },
  { id: 'Rss',           label: 'Blog / RSS',   component: Rss           },
  { id: 'BookOpen',      label: 'Docs / Guide', component: BookOpen      },
  { id: 'FileText',      label: 'Menu / PDF',   component: FileText      },
  { id: 'ShoppingBag',   label: 'Shop',         component: ShoppingBag   },
  { id: 'Store',         label: 'Storefront',   component: Store         },
  { id: 'Package',       label: 'Products',     component: Package       },
  { id: 'Leaf',          label: 'Cannabis',     component: Leaf          },
  { id: 'MapPin',        label: 'Directions',   component: MapPin        },
  { id: 'Calendar',      label: 'Events',       component: Calendar      },
  { id: 'Phone',         label: 'Phone',        component: Phone         },
  { id: 'Mail',          label: 'Email',        component: Mail          },
  { id: 'MessageCircle', label: 'Chat / SMS',   component: MessageCircle },
  { id: 'Star',          label: 'Reviews',      component: Star          },
  { id: 'Heart',         label: 'Favorites',    component: Heart         },
  { id: 'Zap',           label: 'Deals',        component: Zap           },
  { id: 'Hash',          label: 'Hashtag',      component: Hash          },
  { id: 'Link2',         label: 'Generic link', component: Link2         },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(ICON_OPTIONS.map((o) => [o.id, o.component]));

function IconComp({ id, size = 16 }: { id: string; size?: number }) {
  const C = ICON_MAP[id] ?? Link2;
  return <C size={size} strokeWidth={1.75} />;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface LinkItem {
  id:        string;
  icon:      string;
  title:     string;
  url:       string;
  createdAt: number;
  updatedAt: number;
}

type LinkData = Omit<LinkItem, 'id'>;

function linksPath(orgSlug: string) { return `dispensaries/${orgSlug}/links`; }

function blankLink(): LinkItem {
  return { id: '', icon: 'Globe', title: '', url: '', createdAt: 0, updatedAt: 0 };
}

function ensureHttps(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export const getServerSideProps = withDispensaryAuth();

export default function LinksPage({ user }: { user: AuthUser }) {
  const [links,   setLinks]   = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [draft,   setDraft]   = useState<LinkItem | null>(null);
  const [isNew,   setIsNew]   = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // ── Subscribe ────────────────────────────────────────────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    return onValue(ref(db, linksPath(user.orgSlug)), (snap) => {
      const val = snap.val() as Record<string, LinkData> | null;
      if (val) {
        const list = Object.entries(val).map(([id, d]) => ({ id, ...d }));
        list.sort((a, b) => a.createdAt - b.createdAt);
        setLinks(list);
      } else {
        setLinks([]);
      }
      setLoading(false);
    });
  }, [user.orgSlug]);

  // ── Drawer helpers ───────────────────────────────────────────────────
  function openCreate() { setDraft(blankLink()); setIsNew(true); setIconPickerOpen(false); }
  function openEdit(l: LinkItem) { setDraft({ ...l }); setIsNew(false); setIconPickerOpen(false); }
  function closeDrawer() { setDraft(null); setIconPickerOpen(false); }

  // ── Save ─────────────────────────────────────────────────────────────
  async function save() {
    if (!draft || !draft.title || !draft.url) return;
    setSaving(true);
    const db   = getDispensaryRtdb();
    const path = linksPath(user.orgSlug);
    const now  = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = draft;
    const payload: LinkData = {
      ...data,
      url:       ensureHttps(draft.url),
      updatedAt: now,
      createdAt: isNew ? now : draft.createdAt,
    };

    try {
      if (isNew) {
        await push(ref(db, path), payload);
      } else {
        await set(ref(db, `${path}/${draft.id}`), payload);
      }
      closeDrawer();
    } catch (err) {
      console.error('Failed to save link:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function deleteLink() {
    if (!draft || isNew) return;
    setSaving(true);
    try {
      await remove(ref(getDispensaryRtdb(), `${linksPath(user.orgSlug)}/${draft.id}`));
      closeDrawer();
    } catch (err) {
      console.error('Failed to delete link:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <DispensaryLayout title="Links" user={user} unread={0}>
      <div className={styles.pageTopBar}>
        <span className={styles.pageCount}>
          {loading ? 'Loading…' : `${links.length} link${links.length !== 1 ? 's' : ''}`}
        </span>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
          <Plus size={14} /> Add Link
        </button>
      </div>

      <div className={`${styles.card} ${styles.cardPadNone}`}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : links.length === 0 ? (
          <div className={styles.emptyState}>
            <Link2 size={28} />
            <p className={styles.emptyStateText}>No links yet. Add your first one.</p>
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className={styles.listItem} onClick={() => openEdit(link)}>
              <div className={styles.listItemIcon}>
                <IconComp id={link.icon} size={16} />
              </div>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemName}>{link.title}</div>
                <div className={styles.listItemSub}>{link.url}</div>
              </div>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: 'rgba(255,255,255,0.25)', padding: '0.25rem', flexShrink: 0 }}
              >
                <ExternalLink size={13} />
              </a>
              <ChevronRight size={14} className={styles.listItemChevron} />
            </div>
          ))
        )}
      </div>

      {/* ── Drawer ── */}
      {draft && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>{isNew ? 'Add Link' : 'Edit Link'}</h2>
              <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              {/* Icon picker */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>
                  Icon
                </label>

                {/* Current icon + toggle */}
                <button
                  onClick={() => setIconPickerOpen((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: '#1a2219', border: '1px solid #2a352a', borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', color: '#fff', width: '100%' }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#228c58', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp id={draft.icon} size={14} />
                  </div>
                  <span style={{ fontSize: '0.8125rem' }}>{ICON_OPTIONS.find((o) => o.id === draft.icon)?.label ?? draft.icon}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                    {iconPickerOpen ? 'Close ↑' : 'Change ↓'}
                  </span>
                </button>

                {/* Grid picker */}
                {iconPickerOpen && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem', marginTop: '0.5rem', background: '#1a2219', border: '1px solid #2a352a', borderRadius: 8, padding: '0.625rem' }}>
                    {ICON_OPTIONS.map((opt) => {
                      const selected = draft.icon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          title={opt.label}
                          onClick={() => { setDraft({ ...draft, icon: opt.id }); setIconPickerOpen(false); }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.25rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: selected ? 'rgba(13,49,33,0.8)' : 'transparent', color: selected ? '#6dc898' : 'rgba(255,255,255,0.55)' }}
                        >
                          <opt.component size={16} strokeWidth={1.75} />
                          <span style={{ fontSize: '0.6rem', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className={styles.field}>
                <label>Title</label>
                <input
                  value={draft.title}
                  placeholder="e.g. Our Menu, Instagram, Weedmaps"
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>

              {/* URL */}
              <div className={styles.field}>
                <label>URL</label>
                <input
                  value={draft.url}
                  placeholder="https://example.com"
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  onBlur={() => draft.url && setDraft({ ...draft, url: ensureHttps(draft.url) })}
                />
              </div>

              {/* Preview */}
              {draft.url && (
                <a
                  href={ensureHttps(draft.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#3aab72', textDecoration: 'none' }}
                >
                  <ExternalLink size={11} /> Preview link
                </a>
              )}
            </div>

            <div className={styles.drawerFooter}>
              {!isNew && (
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteLink} disabled={saving}>Delete</button>
              )}
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeDrawer} disabled={saving}>Cancel</button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={save}
                disabled={saving || !draft.title || !draft.url}
              >
                {saving
                  ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : isNew ? 'Add Link' : 'Save Changes'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </DispensaryLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
import { ref as dbRef, onValue, push, set, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Tag, Plus, ChevronRight, Image as ImageIcon, Loader2, X } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb, getDispensaryStorage } from '../../lib/dispensary/firebase/client';
import styles from '../../styles/dispensary/Dispensary.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

type DealStatus = 'draft' | 'scheduled' | 'active' | 'expired';

interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startAt: string;   // datetime-local format: "2026-07-04T09:00"
  endAt: string;
  locationNames: string[];
  isDraft: boolean;
  createdAt: number;
  updatedAt: number;
}

type DealData = Omit<Deal, 'id'>;

interface LocationOption { id: string; name: string; }

// ── Helpers ────────────────────────────────────────────────────────────────

function computeStatus(startAt: string, endAt: string, isDraft: boolean): DealStatus {
  if (isDraft || !startAt || !endAt) return 'draft';
  const now   = Date.now();
  const start = new Date(startAt).getTime();
  const end   = new Date(endAt).getTime();
  if (now < start) return 'scheduled';
  if (now >= start && now <= end) return 'active';
  return 'expired';
}

const STATUS_BADGE: Record<DealStatus, string> = {
  draft:     styles.badgeDefault,
  scheduled: styles.badgeInfo,
  active:    styles.badgeSuccess,
  expired:   styles.badgeDanger,
};

function dealsPath(orgSlug: string)   { return `dispensaries/${orgSlug}/deals`; }
function locPath(orgSlug: string)     { return `dispensaries/${orgSlug}/locations`; }
function imagePath(orgSlug: string, dealId: string) {
  return `dispensaries/${orgSlug}/deals/${dealId}/cover`;
}

function blankDeal(): Deal {
  return {
    id: '', title: '', description: '', imageUrl: '',
    startAt: '', endAt: '', locationNames: [],
    isDraft: true, createdAt: 0, updatedAt: 0,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export const getServerSideProps = withDispensaryAuth();

export default function DealsPage({ user }: { user: AuthUser }) {
  const [deals,     setDeals]     = useState<Deal[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [draft,     setDraft]     = useState<Deal | null>(null);
  const [isNew,     setIsNew]     = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [previewUrl,setPreviewUrl]= useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const derivedStatus = draft
    ? computeStatus(draft.startAt, draft.endAt, draft.isDraft)
    : 'draft';

  // ── Subscribe to deals ──────────────────────────────────────────────
  useEffect(() => {
    const db   = getDispensaryRtdb();
    const path = dealsPath(user.orgSlug);

    const unsub = onValue(dbRef(db, path), (snap) => {
      const val = snap.val() as Record<string, DealData> | null;
      if (val) {
        const list = Object.entries(val).map(([id, data]) => ({ id, ...data }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setDeals(list);
      } else {
        setDeals([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user.orgSlug]);

  // ── Subscribe to locations (for the location picker) ────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    const unsub = onValue(dbRef(db, locPath(user.orgSlug)), (snap) => {
      const val = snap.val() as Record<string, { name: string }> | null;
      if (val) {
        setLocations(Object.entries(val).map(([id, d]) => ({ id, name: d.name })));
      } else {
        setLocations([]);
      }
    });
    return () => unsub();
  }, [user.orgSlug]);

  // ── Drawer helpers ──────────────────────────────────────────────────
  function openCreate() {
    setDraft(blankDeal());
    setLocalFile(null);
    setPreviewUrl('');
    setIsNew(true);
  }

  function openEdit(deal: Deal) {
    setDraft({ ...deal });
    setLocalFile(null);
    setPreviewUrl(deal.imageUrl);
    setIsNew(false);
  }

  function closeDrawer() {
    setDraft(null);
    setLocalFile(null);
    setPreviewUrl('');
    setUploadPct(null);
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setLocalFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearImage() {
    setLocalFile(null);
    setPreviewUrl('');
    if (draft) setDraft({ ...draft, imageUrl: '' });
    if (fileRef.current) fileRef.current.value = '';
  }

  function toggleLocation(name: string) {
    if (!draft) return;
    const cur  = draft.locationNames ?? [];
    const next = cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name];
    setDraft({ ...draft, locationNames: next });
  }

  // ── Save ────────────────────────────────────────────────────────────
  async function save() {
    if (!draft || !draft.title) return;
    setSaving(true);
    setUploadPct(null);

    try {
      const db      = getDispensaryRtdb();
      const storage = getDispensaryStorage();
      const now     = Date.now();
      const dealId  = isNew ? push(dbRef(db, dealsPath(user.orgSlug))).key! : draft.id;

      let imageUrl = previewUrl.startsWith('blob:') ? '' : (draft.imageUrl || '');

      // Upload new image to Storage if one was selected
      if (localFile) {
        setUploadPct(0);
        const imgRef = storageRef(storage, imagePath(user.orgSlug, dealId));
        const snap   = await uploadBytes(imgRef, localFile);
        imageUrl     = await getDownloadURL(snap.ref);
        setUploadPct(100);
      }

      const payload: DealData = {
        title:         draft.title,
        description:   draft.description,
        imageUrl,
        startAt:       draft.startAt,
        endAt:         draft.endAt,
        locationNames: draft.locationNames ?? [],
        isDraft:       draft.isDraft,
        createdAt:     isNew ? now : draft.createdAt,
        updatedAt:     now,
      };

      await set(dbRef(db, `${dealsPath(user.orgSlug)}/${dealId}`), payload);
      closeDrawer();
    } catch (err) {
      console.error('Failed to save deal:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────
  async function deleteDeal() {
    if (!draft || isNew) return;
    setSaving(true);
    try {
      const db      = getDispensaryRtdb();
      const storage = getDispensaryStorage();

      // Delete cover image from Storage if it exists
      if (draft.imageUrl) {
        try {
          await deleteObject(storageRef(storage, imagePath(user.orgSlug, draft.id)));
        } catch { /* image may not exist — ignore */ }
      }

      await remove(dbRef(db, `${dealsPath(user.orgSlug)}/${draft.id}`));
      closeDrawer();
    } catch (err) {
      console.error('Failed to delete deal:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <DispensaryLayout title="Deals" user={user} unread={0}>
      <div className={styles.pageTopBar}>
        <span className={styles.pageCount}>
          {loading ? 'Loading…' : `${deals.length} deal${deals.length !== 1 ? 's' : ''}`}
        </span>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
          <Plus size={14} /> New Deal
        </button>
      </div>

      <div className={`${styles.card} ${styles.cardPadNone}`}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : deals.length === 0 ? (
          <div className={styles.emptyState}>
            <Tag size={28} />
            <p className={styles.emptyStateText}>No deals yet. Create your first promotion.</p>
          </div>
        ) : (
          deals.map((deal) => {
            const status = computeStatus(deal.startAt, deal.endAt, deal.isDraft);
            return (
              <div key={deal.id} className={styles.listItem} onClick={() => openEdit(deal)}>
                {deal.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={deal.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div className={styles.listItemIcon}><Tag size={16} /></div>
                )}
                <div className={styles.listItemInfo}>
                  <div className={styles.listItemName}>{deal.title}</div>
                  <div className={styles.listItemSub}>
                    {(deal.locationNames ?? []).length ? (deal.locationNames ?? []).join(', ') : 'No locations'}
                    {deal.startAt ? ` · ${deal.startAt.slice(0, 10)}` : ''}
                    {deal.endAt   ? ` → ${deal.endAt.slice(0, 10)}`   : ''}
                  </div>
                </div>
                <span className={`${styles.badge} ${STATUS_BADGE[status]}`}>{status}</span>
                <ChevronRight size={14} className={styles.listItemChevron} />
              </div>
            );
          })
        )}
      </div>

      {/* ── Drawer ── */}
      {draft && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>{isNew ? 'New Deal' : 'Edit Deal'}</h2>
              <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Status</span>
                <span className={`${styles.badge} ${STATUS_BADGE[derivedStatus]}`}>{derivedStatus}</span>
                <label className={styles.hoursOpenLabel} style={{ marginLeft: 'auto' }}>
                  <input
                    type="checkbox"
                    checked={draft.isDraft}
                    onChange={(e) => setDraft({ ...draft, isDraft: e.target.checked })}
                    style={{ accentColor: '#228c58' }}
                  />
                  Keep as draft
                </label>
              </div>

              {/* Image upload */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.375rem' }}>
                  Cover image
                </label>
                <div
                  className={styles.imageUpload}
                  onClick={() => !previewUrl && fileRef.current?.click()}
                  style={{ cursor: previewUrl ? 'default' : 'pointer' }}
                >
                  {previewUrl ? (
                    <div style={{ position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Deal cover" className={styles.imagePreview} />
                      <button
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.imageUploadEmpty}>
                      <ImageIcon size={20} />
                      <span>Click to upload image</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
                {uploadPct !== null && uploadPct < 100 && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.375rem' }}>
                    Uploading…
                  </p>
                )}
              </div>

              {/* Title */}
              <div className={styles.field}>
                <label>Title</label>
                <input
                  value={draft.title}
                  placeholder="e.g. 20% Off Top-Shelf Flower"
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  value={draft.description}
                  placeholder="Describe the deal…"
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              {/* Start / End datetime */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>
                  Schedule
                </label>
                <div className={styles.dateGrid}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.25rem' }}>Start</label>
                    <input
                      className={styles.dateInput}
                      type="datetime-local"
                      value={draft.startAt}
                      onChange={(e) => setDraft({ ...draft, startAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.25rem' }}>End</label>
                    <input
                      className={styles.dateInput}
                      type="datetime-local"
                      value={draft.endAt}
                      onChange={(e) => setDraft({ ...draft, endAt: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>
                  Locations
                </label>
                {locations.length === 0 ? (
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.3)' }}>
                    No locations set up yet. Add locations first.
                  </p>
                ) : (
                  <div className={styles.locationCheckList}>
                    {locations.map((loc) => (
                      <label key={loc.id} className={styles.locationCheck}>
                        <input
                          type="checkbox"
                          checked={(draft.locationNames ?? []).includes(loc.name)}
                          onChange={() => toggleLocation(loc.name)}
                          style={{ accentColor: '#228c58' }}
                        />
                        {loc.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              {!isNew && (
                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteDeal} disabled={saving}>
                  Delete
                </button>
              )}
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeDrawer} disabled={saving}>
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={save}
                disabled={saving || !draft.title}
              >
                {saving
                  ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : isNew ? 'Create Deal' : 'Save Changes'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </DispensaryLayout>
  );
}

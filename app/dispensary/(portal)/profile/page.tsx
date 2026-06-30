"use client";

import { useState } from "react";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { dispensaryAuth, dispensaryDb, dispensaryStorage } from "@component/lib/dispensary/firebase/client";
import { DispensaryHeader } from "@component/components/dispensary/layout/Header";
import { Button, Card, Input, Divider } from "@component/components/dispensary/ui";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import { User, Camera } from "lucide-react";
import Image from "next/image";

export default function DispensaryProfilePage() {
  const { user, setUser } = useDispensaryAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail]             = useState(user?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [uploading, setUploading]     = useState(false);

  const handleSaveProfile = async () => {
    if (!dispensaryAuth.currentUser || !user) return;
    setSaving(true);
    try {
      await updateProfile(dispensaryAuth.currentUser, { displayName });
      if (email !== user.email) await updateEmail(dispensaryAuth.currentUser, email);
      if (newPassword) await updatePassword(dispensaryAuth.currentUser, newPassword);
      await updateDoc(doc(dispensaryDb, "users", user.uid), { displayName, email });
      setUser({ ...user, displayName, email });
      setSaved(true);
      setNewPassword("");
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dispensaryAuth.currentUser || !user) return;
    setUploading(true);
    try {
      const storageRef = ref(dispensaryStorage, `users/${user.uid}/avatar`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(dispensaryAuth.currentUser, { photoURL });
      await updateDoc(doc(dispensaryDb, "users", user.uid), { photoURL });
      setUser({ ...user, photoURL });
    } finally { setUploading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <DispensaryHeader title="Profile" />
      <div className="flex-1 p-6 max-w-lg space-y-6">

        <Card className="flex items-center gap-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-surface-300 flex items-center justify-center overflow-hidden text-white/50">
              {user?.photoURL ? (
                <Image src={user.photoURL} alt="" width={64} height={64} className="object-cover" />
              ) : <User size={24} />}
            </div>
            <label className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-brand-600 flex items-center justify-center cursor-pointer hover:bg-brand-500 transition-colors">
              <Camera size={11} className="text-white" />
              <input type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} />
            </label>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-surface-0/60 flex items-center justify-center">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user?.displayName || "—"}</p>
            <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
            <p className="text-xs text-white/30 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-white">Account info</h2>
          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Divider />
          <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" hint="At least 8 characters." />
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSaveProfile} loading={saving}>Save changes</Button>
            {saved && <span className="text-xs text-brand-400">Saved</span>}
          </div>
        </Card>

      </div>
    </div>
  );
}

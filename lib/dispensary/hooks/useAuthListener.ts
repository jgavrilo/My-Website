"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { dispensaryAuth, dispensaryDb } from "@component/lib/dispensary/firebase/client";
import { orgRef } from "@component/lib/dispensary/firebase/collections";
import { useDispensaryAuthStore } from "@component/lib/dispensary/store/auth";
import type { DispensaryUser } from "@component/lib/dispensary/types";

export function useDispensaryAuthListener() {
  const { setUser, setOrganization, setLoading, clear } = useDispensaryAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(dispensaryAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        clear();
        return;
      }

      const userSnap = await getDoc(doc(dispensaryDb, "users", firebaseUser.uid));
      if (!userSnap.exists()) {
        clear();
        return;
      }

      const userData = userSnap.data() as Omit<DispensaryUser, "uid">;
      const user: DispensaryUser = { uid: firebaseUser.uid, ...userData };
      setUser(user);
      setLoading(false);

      const orgSnap = await getDoc(orgRef(user.organizationId));
      if (orgSnap.exists()) {
        setOrganization(orgSnap.data());
      }
    });

    return unsubscribe;
  }, [setUser, setOrganization, setLoading, clear]);
}

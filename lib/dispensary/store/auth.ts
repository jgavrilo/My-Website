import { create } from "zustand";
import type { DispensaryUser, Organization } from "@component/lib/dispensary/types";

interface DispensaryAuthState {
  user:         DispensaryUser | null;
  organization: Organization | null;
  loading:      boolean;
  setUser:         (user: DispensaryUser | null) => void;
  setOrganization: (org:  Organization | null)   => void;
  setLoading:      (v:    boolean)               => void;
  clear:           ()                            => void;
}

export const useDispensaryAuthStore = create<DispensaryAuthState>((set) => ({
  user:         null,
  organization: null,
  loading:      true,

  setUser:         (user)    => set({ user }),
  setOrganization: (org)     => set({ organization: org }),
  setLoading:      (loading) => set({ loading }),
  clear:           ()        => set({ user: null, organization: null, loading: false }),
}));

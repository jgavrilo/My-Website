export interface ClientDemo {
  slug: string;
  name: string;
  /** Full URL of the hosted preview (iframe src) */
  url: string;
  passwordHash: string;
  passwordSalt: string;
  /** Set to false to temporarily disable without deleting the entry */
  active: boolean;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Resolve the logged-in partner's UUID from NextAuth session.
 * Returns null if the session doesn't belong to a partner.
 */
export async function getPartnerIdFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const role = (session.user as { role?: string }).role;
  if (role !== "Partner") return null;

  const id = (session.user as { id?: string }).id;
  return id || null;
}

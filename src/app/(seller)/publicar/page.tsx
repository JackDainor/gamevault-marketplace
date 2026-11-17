import { ensureListingsTable, getDb } from "@/lib/db";
import PublishForm from "./publish-form";

export const dynamic = "force-dynamic";

export default async function PublishPage() {
  await ensureListingsTable();
  const sql = getDb();
  const rows = await sql`SELECT value FROM app_settings WHERE key = 'commission_bs' LIMIT 1`;
  const commission = Math.max(0, Number(rows[0]?.value ?? "30") || 0);
  return <PublishForm commission={commission} />;
}

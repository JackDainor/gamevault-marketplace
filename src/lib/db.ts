import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta configurar DATABASE_URL en Vercel.");
  return neon(url);
}

export async function ensureUsersTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      whatsapp VARCHAR(30) NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function ensureListingsTable() {
  await ensureUsersTable();
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(20) NOT NULL UNIQUE,
      seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game VARCHAR(60) NOT NULL,
      title VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      account_details TEXT NOT NULL,
      seller_price NUMERIC(12,2) NOT NULL,
      commission_bs NUMERIC(12,2) NOT NULL DEFAULT 30,
      public_price NUMERIC(12,2) NOT NULL,
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS listings_status_created_idx ON listings(status, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS listings_seller_created_idx ON listings(seller_id, created_at DESC)`;
}

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
  await ensureSettingsTable();
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

export async function ensureSettingsTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(80) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO app_settings (key, value) VALUES ('commission_bs', '30')
    ON CONFLICT (key) DO NOTHING
  `;
}


export async function ensureSalesTable() {
  await ensureListingsTable();
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
      listing_code VARCHAR(20) NOT NULL,
      game VARCHAR(60) NOT NULL,
      title VARCHAR(120) NOT NULL,
      seller_name VARCHAR(100) NOT NULL,
      seller_email VARCHAR(255) NOT NULL,
      seller_whatsapp VARCHAR(30) NOT NULL,
      buyer_name VARCHAR(100) NOT NULL DEFAULT '',
      buyer_whatsapp VARCHAR(30) NOT NULL DEFAULT '',
      seller_price NUMERIC(12,2) NOT NULL,
      commission_bs NUMERIC(12,2) NOT NULL,
      public_price NUMERIC(12,2) NOT NULL,
      sold_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS sales_listing_unique_idx ON sales(listing_id) WHERE listing_id IS NOT NULL`;
  await sql`
    INSERT INTO sales (listing_id, listing_code, game, title, seller_name, seller_email, seller_whatsapp,
      seller_price, commission_bs, public_price, sold_at)
    SELECT l.id,l.code,l.game,l.title,u.name,u.email,u.whatsapp,l.seller_price,l.commission_bs,l.public_price,l.updated_at
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE l.status='sold'
    ON CONFLICT (listing_id) WHERE listing_id IS NOT NULL DO NOTHING
  `;
}

"use server";

import { timingSafeEqual, randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, isAdmin, hashPassword } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";

export type AdminState = { error?: string };

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function adminLoginAction(_previous: AdminState, formData: FormData): Promise<AdminState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "La contraseña de administración no está configurada en Vercel." };
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "Contraseña incorrecta." };
  await createAdminSession();
  redirect("/admin/panel");
}

export async function adminLogoutAction() {
  await destroyAdminSession();
  redirect("/admin");
}

export async function createAdminListingAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");

  const game = String(formData.get("game") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const accountDetails = String(formData.get("accountDetails") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const phoneDigits = whatsapp.replace(/\D/g, "");
  const price = Number(formData.get("price"));
  const allowedGames = ["Free Fire", "Roblox", "Fortnite", "Call of Duty", "Otro"];

  if (!allowedGames.includes(game)) redirect("/admin/panel?adminCreateError=game");
  if (title.length < 4 || title.length > 120) redirect("/admin/panel?adminCreateError=title");
  if (description.length < 20 || description.length > 1800) redirect("/admin/panel?adminCreateError=description");
  if (accountDetails.length < 5 || accountDetails.length > 1200) redirect("/admin/panel?adminCreateError=details");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) redirect("/admin/panel?adminCreateError=whatsapp");
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) redirect("/admin/panel?adminCreateError=price");

  const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length < 1 || files.length > 10) redirect("/admin/panel?adminCreateError=images");
  if (files.some(file => !ALLOWED_TYPES.includes(file.type))) redirect("/admin/panel?adminCreateError=type");
  if (files.some(file => file.size > MAX_FILE_SIZE)) redirect("/admin/panel?adminCreateError=size");
  if (files.reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024) redirect("/admin/panel?adminCreateError=total");

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) redirect("/admin/panel?adminCreateError=storage");

  const code = `GV-${randomBytes(4).toString("hex").toUpperCase()}`;
  try {
    const imageUrls: string[] = [];
    for (const file of files) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const blob = await put(`listings/admin/${code}/${randomBytes(12).toString("hex")}.${extension}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
        token,
      });
      imageUrls.push(blob.url);
    }

    await ensureListingsTable();
    const sql = getDb();
    const sellerEmail = `admin-${code.toLowerCase()}@gamevault.local`;
    const sellerRows = await sql`
      INSERT INTO users (name, email, whatsapp, password_hash)
      VALUES ('GameVault', ${sellerEmail}, ${whatsapp}, ${hashPassword(randomBytes(32).toString("hex"))})
      RETURNING id
    `;
    const adminSellerId = sellerRows[0]?.id;
    if (!adminSellerId) throw new Error("No se pudo crear el vendedor interno.");

    // El administrador define directamente el precio final; no se aplica comisión adicional.
    await sql`
      INSERT INTO listings
        (code, seller_id, game, title, description, account_details, seller_price, commission_bs, public_price, images, status)
      VALUES
        (${code}, ${String(adminSellerId)}, ${game}, ${title}, ${description}, ${accountDetails},
         ${price}, 0, ${price}, ${JSON.stringify(imageUrls)}::jsonb, 'approved')
    `;
  } catch (error) {
    console.error("ADMIN_CREATE_LISTING_ERROR", error);
    redirect("/admin/panel?adminCreateError=save");
  }

  redirect("/admin/panel?adminCreated=1");
}

export async function updateListingStatusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("listingId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["pending", "approved", "reserved", "sold", "rejected"].includes(status)) return;
  await ensureListingsTable();
  const sql = getDb();
  await sql`UPDATE listings SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  redirect("/admin/panel");
}

export async function updateCommissionAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const amount = Number(formData.get("commission"));
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) redirect("/admin/panel?commissionError=1");
  await ensureListingsTable();
  const sql = getDb();
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('commission_bs', ${String(amount)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  redirect("/admin/panel?commissionSaved=1");
}


export async function updateListingAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("listingId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const accountDetails = String(formData.get("accountDetails") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const phoneDigits = whatsapp.replace(/\D/g, "");
  const price = Number(formData.get("price"));

  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/panel?editError=id");
  if (title.length < 4 || title.length > 120 || description.length < 20 || description.length > 1800 || accountDetails.length < 5 || accountDetails.length > 1200) redirect("/admin/panel?editError=fields");
  if (phoneDigits.length < 8 || phoneDigits.length > 15) redirect("/admin/panel?editError=whatsapp");
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) redirect("/admin/panel?editError=price");

  await ensureListingsTable();
  const sql = getDb();
  await sql`
    UPDATE listings
    SET title = ${title}, description = ${description}, account_details = ${accountDetails},
        seller_price = ${price}, public_price = ${price + 0} + commission_bs,
        updated_at = NOW()
    WHERE id = ${id}
  `;
  await sql`
    UPDATE users SET whatsapp = ${whatsapp}
    WHERE id = (SELECT seller_id FROM listings WHERE id = ${id})
  `;
  redirect("/admin/panel?edited=1");
}

export async function deleteListingAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("listingId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/panel?deleteError=1");
  await ensureListingsTable();
  const sql = getDb();
  const ownerRows = await sql`SELECT seller_id FROM listings WHERE id = ${id} LIMIT 1`;
  if (!ownerRows[0]) redirect("/admin/panel?deleteError=1");
  const sellerId = String(ownerRows[0].seller_id);
  await sql`DELETE FROM listings WHERE id = ${id}`;
  await sql`
    DELETE FROM users
    WHERE id = ${sellerId}
      AND email LIKE 'admin-%@gamevault.local'
      AND NOT EXISTS (SELECT 1 FROM listings WHERE seller_id = ${sellerId})
  `;
  redirect("/admin/panel?deleted=1");
}

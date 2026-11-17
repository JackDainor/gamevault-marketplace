"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, isAdmin } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";

export type AdminState = { error?: string };

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

export async function updateListingStatusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("listingId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["pending", "approved", "reserved", "sold", "rejected"].includes(status)) return;
  await ensureListingsTable();
  const sql = getDb();
  await sql`UPDATE listings SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  redirect("/admin");
}

export async function updateCommissionAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const amount = Number(formData.get("commission"));
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) redirect("/admin?commissionError=1");
  await ensureListingsTable();
  const sql = getDb();
  await sql`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('commission_bs', ${String(amount)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
  redirect("/admin?commissionSaved=1");
}

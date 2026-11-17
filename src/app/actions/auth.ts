"use server";

import { redirect } from "next/navigation";
import { ensureUsersTable, getDb } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string };

export async function registerAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2 || name.length > 100) return { error: "Escribe tu nombre (mínimo 2 caracteres)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Escribe un correo válido." };
  if (whatsapp.length < 7 || whatsapp.length > 30) return { error: "Escribe un WhatsApp válido con código de país." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  try {
    await ensureUsersTable();
    const sql = getDb();
    const rows = await sql`
      INSERT INTO users (name, email, whatsapp, password_hash)
      VALUES (${name}, ${email}, ${whatsapp}, ${hashPassword(password)})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (!rows.length) return { error: "Ese correo ya está registrado. Inicia sesión." };
    await createSession(String(rows[0].id));
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return { error: "No se pudo crear tu cuenta. Verifica la conexión con la base de datos e inténtalo otra vez." };
  }
  redirect("/mi-cuenta");
}

export async function loginAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completa tu correo y contraseña." };
  try {
    await ensureUsersTable();
    const sql = getDb();
    const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${email} LIMIT 1`;
    if (!rows.length || !verifyPassword(password, String(rows[0].password_hash))) {
      return { error: "Correo o contraseña incorrectos." };
    }
    await createSession(String(rows[0].id));
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    return { error: "No se pudo iniciar sesión. Inténtalo de nuevo." };
  }
  redirect("/mi-cuenta");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

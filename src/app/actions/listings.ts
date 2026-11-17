"use server";

import { put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";

export type ListingState = { error?: string };

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function createListingAction(_previous: ListingState, formData: FormData): Promise<ListingState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const game = String(formData.get("game") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const accountDetails = String(formData.get("accountDetails") ?? "").trim();
  const sellerPrice = Number(formData.get("sellerPrice"));
  const allowedGames = ["Free Fire", "Roblox", "Fortnite", "Call of Duty", "Otro"];
  if (!allowedGames.includes(game)) return { error: "Selecciona un juego válido." };
  if (title.length < 4 || title.length > 120) return { error: "El título debe tener entre 4 y 120 caracteres." };
  if (description.length < 20 || description.length > 1800) return { error: "La descripción debe tener entre 20 y 1800 caracteres." };
  if (accountDetails.length < 5 || accountDetails.length > 1200) return { error: "Completa los detalles principales de la cuenta." };
  if (!Number.isFinite(sellerPrice) || sellerPrice <= 0 || sellerPrice > 1000000) return { error: "Escribe un precio válido en bolivianos." };

  const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length < 1 || files.length > 10) return { error: "Selecciona entre 1 y 10 imágenes." };
  if (files.some(file => !ALLOWED_TYPES.includes(file.type))) return { error: "Solo se permiten imágenes JPG, PNG o WEBP." };
  if (files.some(file => file.size > MAX_FILE_SIZE)) return { error: "Cada imagen debe pesar como máximo 1 MB. Reduce su tamaño e inténtalo otra vez." };
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > 4 * 1024 * 1024) return { error: "El conjunto de imágenes supera los 4 MB. Reduce el tamaño de las fotos e inténtalo otra vez." };

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return { error: "El almacenamiento de imágenes todavía no está configurado." };

  try {
    const imageUrls: string[] = [];
    for (const file of files) {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const blob = await put(`listings/${String(user.id)}/${randomBytes(12).toString("hex")}.${extension}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
        token,
      });
      imageUrls.push(blob.url);
    }

    await ensureListingsTable();
    const sql = getDb();
    const settingRows = await sql`SELECT value FROM app_settings WHERE key = 'commission_bs' LIMIT 1`;
    const commission = Math.max(0, Number(settingRows[0]?.value ?? "30") || 30);
    const publicPrice = Math.round((sellerPrice + commission) * 100) / 100;
    const code = `GV-${randomBytes(4).toString("hex").toUpperCase()}`;
    await sql`
      INSERT INTO listings
        (code, seller_id, game, title, description, account_details, seller_price, commission_bs, public_price, images, status)
      VALUES
        (${code}, ${String(user.id)}, ${game}, ${title}, ${description}, ${accountDetails},
         ${sellerPrice}, ${commission}, ${publicPrice}, ${JSON.stringify(imageUrls)}::jsonb, 'pending')
    `;
  } catch (error) {
    console.error("CREATE_LISTING_ERROR", error);
    return { error: "No se pudo guardar la publicación. Comprueba tu conexión e inténtalo otra vez." };
  }

  redirect("/mi-cuenta/publicaciones?created=1");
}

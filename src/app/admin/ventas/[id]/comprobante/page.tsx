import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";
import PrintButton from "@/components/print-button";

export const dynamic = "force-dynamic";

type Sale = { code:string; game:string; title:string; description:string; account_details:string; public_price:string; seller_price:string; commission_bs:string; updated_at:string; seller_name:string; seller_email:string; seller_whatsapp:string };

export default async function SaleReceiptPage({params}:{params:Promise<{id:string}>}) {
  if (!(await isAdmin())) redirect("/admin");
  await ensureListingsTable();
  const {id}=await params;
  const sql=getDb();
  const rows=await sql`
    SELECT l.code,l.game,l.title,l.description,l.account_details,l.public_price::text,
      l.seller_price::text,l.commission_bs::text,l.updated_at,
      u.name AS seller_name,u.email AS seller_email,u.whatsapp AS seller_whatsapp
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE l.id=${id} AND l.status='sold' LIMIT 1
  ` as Sale[];
  const sale=rows[0];
  if(!sale) notFound();

  return <main className="receipt-page">
    <div className="receipt-actions no-print"><Link href="/admin/panel" className="btn">← Volver al panel</Link><PrintButton/></div>
    <article className="receipt-paper">
      <header className="receipt-header"><div className="brand">GAME<span>VAULT</span></div><span className="status-pill status-sold">VENTA REGISTRADA</span></header>
      <p className="eyebrow">COMPROBANTE INTERNO</p>
      <h1>Registro de venta</h1>
      <p className="receipt-code">Código de publicación: <strong>{sale.code}</strong></p>
      <div className="receipt-divider"/>
      <h2>Datos de la cuenta</h2>
      <p><span>Juego</span><strong>{sale.game}</strong></p>
      <p><span>Publicación</span><strong>{sale.title}</strong></p>
      <p><span>Precio público registrado</span><strong>Bs {Number(sale.public_price).toFixed(2)}</strong></p>
      <p><span>Fecha de registro como vendida</span><strong>{new Date(sale.updated_at).toLocaleString("es-BO")}</strong></p>
      <div className="receipt-divider"/>
      <h2>Datos del vendedor</h2>
      <p><span>Nombre</span><strong>{sale.seller_name}</strong></p>
      <p><span>Correo</span><strong>{sale.seller_email}</strong></p>
      <p><span>WhatsApp</span><strong>{sale.seller_whatsapp}</strong></p>
      <div className="receipt-note">Este documento es un registro interno de GameVault. Indica que el administrador marcó esta publicación como vendida; no acredita por sí solo que se haya recibido un pago ni sustituye una factura o comprobante bancario.</div>
      <footer>GameVault Marketplace · {sale.code}</footer>
    </article>
  </main>;
}

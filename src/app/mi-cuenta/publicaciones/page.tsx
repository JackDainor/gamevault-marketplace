import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Listing = { id:string; code:string; game:string; title:string; seller_price:string; public_price:string; status:string; images:string[]; created_at:string };

const statusLabel: Record<string,string> = { pending:"Pendiente de revisión", approved:"Disponible", reserved:"Reservada", sold:"Vendida", rejected:"No aprobada" };

export default async function MyListingsPage({searchParams}:{searchParams:Promise<{created?:string}>}) {
  const user = await requireUser();
  await ensureListingsTable();
  const sql = getDb();
  const listings = await sql`
    SELECT id, code, game, title, seller_price::text, public_price::text, status, images, created_at
    FROM listings WHERE seller_id = ${String(user.id)} ORDER BY created_at DESC
  ` as Listing[];
  const params = await searchParams;
  return <main className="auth-page">
    <section className="publish-card">
      <div className="publish-top"><Link href="/mi-cuenta" className="auth-back">← Mi cuenta</Link><Link href="/publicar" className="btn primary">+ Publicar cuenta</Link></div>
      <span className="eyebrow">TU ACTIVIDAD</span><h1>Mis publicaciones</h1>
      {params.created && <p className="success-message">¡Tu publicación fue enviada! Está pendiente de revisión.</p>}
      {listings.length === 0 ? <div className="empty-state"><h3>Aún no tienes publicaciones</h3><p className="muted">Cuando publiques una cuenta, aparecerá aquí con su estado.</p><Link href="/publicar" className="btn primary">Publicar mi primera cuenta</Link></div> :
        <div className="seller-list">{listings.map(item=><article className="seller-list-card" key={item.id}>
          {item.images?.[0] && <img src={item.images[0]} alt={item.title}/>}
          <div className="seller-list-info"><span className="eyebrow">{item.game} · {item.code}</span><h3>{item.title}</h3><p className="muted">Tu precio: Bs {Number(item.seller_price).toFixed(2)} · Público: Bs {Number(item.public_price).toFixed(2)}</p><span className={`status-pill status-${item.status}`}>{statusLabel[item.status] ?? item.status}</span></div>
        </article>)}</div>}
    </section>
  </main>;
}

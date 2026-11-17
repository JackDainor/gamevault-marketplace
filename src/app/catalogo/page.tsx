import Link from "next/link";
import { ensureListingsTable, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Listing = { id:string; code:string; game:string; title:string; description:string; public_price:string; images:string[] };

export default async function CatalogPage() {
  await ensureListingsTable();
  const sql = getDb();
  const listings = await sql`
    SELECT id, code, game, title, description, public_price::text, images
    FROM listings WHERE status = 'approved' ORDER BY created_at DESC
  ` as Listing[];
  return <main className="shell catalog-page">
    <header className="nav"><Link href="/" className="brand">GAME<span>VAULT</span></Link><div className="nav-actions"><Link href="/mi-cuenta" className="btn">Mi cuenta</Link><Link href="/publicar" className="btn primary">Vender cuenta</Link></div></header>
    <section className="catalog-heading"><span className="eyebrow">MARKETPLACE GAMER</span><h1>Catálogo de cuentas</h1><p className="muted">Publicaciones revisadas y disponibles para consultar.</p></section>
    {listings.length === 0 ? <div className="empty-state"><h3>Estamos preparando el catálogo</h3><p className="muted">Todavía no hay cuentas aprobadas para mostrar. Vuelve pronto.</p><Link href="/publicar" className="btn primary">Publicar una cuenta</Link></div> :
      <div className="catalog-grid">{listings.map(item=><Link className="catalog-card" href={`/cuenta/${item.id}`} key={item.id}>
        {item.images?.[0] ? <img src={item.images[0]} alt={item.title}/> : <div className="catalog-placeholder">🎮</div>}
        <div className="catalog-card-body"><span className="eyebrow">{item.game} · {item.code}</span><h3>{item.title}</h3><p className="muted">{item.description}</p><strong>Bs {Number(item.public_price).toFixed(2)}</strong></div>
      </Link>)}</div>}
  </main>;
}

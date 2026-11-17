import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureListingsTable, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Listing = { id:string; code:string; game:string; title:string; description:string; account_details:string; public_price:string; images:string[]; seller_name:string };

export default async function ListingDetailPage({params}:{params:Promise<{id:string}>}) {
  await ensureListingsTable();
  const {id}=await params;
  const sql=getDb();
  const rows=await sql`
    SELECT l.id,l.code,l.game,l.title,l.description,l.account_details,l.public_price::text,l.images,u.name AS seller_name
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE l.id=${id} AND l.status='approved' LIMIT 1
  ` as Listing[];
  const item=rows[0];
  if(!item) notFound();
  const intermediaryRows=await sql`SELECT value FROM app_settings WHERE key='intermediary_whatsapp' LIMIT 1`;
  const phone=String(intermediaryRows[0]?.value ?? "").replace(/\D/g,"");
  const message=encodeURIComponent(`Hola, quiero consultar por la cuenta ${item.code} de GameVault. Juego: ${item.game}. Cuenta: ${item.title}. Precio publicado: Bs ${Number(item.public_price).toFixed(2)}.`);
  return <main className="shell catalog-page">
    <header className="nav"><Link href="/" className="brand">GAME<span>VAULT</span></Link><Link href="/catalogo" className="btn">← Volver al catálogo</Link></header>
    <section className="detail-layout">
      <div><div className="detail-gallery">{item.images.map((src,index)=><img src={src} alt={`${item.title} foto ${index+1}`} key={src}/>)}</div></div>
      <article className="detail-info"><span className="eyebrow">{item.game} · {item.code}</span><h1>{item.title}</h1><h2>Bs {Number(item.public_price).toFixed(2)}</h2><p className="muted">{item.description}</p><div className="account-notice"><strong>Detalles de la cuenta</strong><p>{item.account_details}</p></div><p className="muted">Publicado por: {item.seller_name}</p>{phone.length>=8?<a className="btn primary auth-submit" href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer">Consultar con el intermediario por WhatsApp</a>:<p className="form-error">El contacto del intermediario todavía no está configurado. Inténtalo más tarde.</p>}<small className="muted">Tu consulta llegará al intermediario de GameVault, quien te ayudará a coordinar con el vendedor. No realices pagos antes de confirmar las condiciones.</small></article>
    </section>
  </main>;
}

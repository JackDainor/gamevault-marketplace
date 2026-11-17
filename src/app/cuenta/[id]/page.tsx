import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureListingsTable, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type Listing = { id:string; code:string; game:string; title:string; description:string; account_details:string; public_price:string; images:string[]; seller_name:string; seller_whatsapp:string };

export default async function ListingDetailPage({params}:{params:Promise<{id:string}>}) {
  await ensureListingsTable();
  const {id}=await params;
  const sql=getDb();
  const rows=await sql`
    SELECT l.id,l.code,l.game,l.title,l.description,l.account_details,l.public_price::text,l.images,u.name AS seller_name,u.whatsapp AS seller_whatsapp
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE l.id=${id} AND l.status='approved' LIMIT 1
  ` as Listing[];
  const item=rows[0];
  if(!item) notFound();
  const phone=item.seller_whatsapp.replace(/\D/g,"");
  const message=encodeURIComponent(`Hola, me interesa la cuenta ${item.code} de GameVault: ${item.title}`);
  return <main className="shell catalog-page">
    <header className="nav"><Link href="/" className="brand">GAME<span>VAULT</span></Link><Link href="/catalogo" className="btn">← Volver al catálogo</Link></header>
    <section className="detail-layout">
      <div><div className="detail-gallery">{item.images.map((src,index)=><img src={src} alt={`${item.title} foto ${index+1}`} key={src}/>)}</div></div>
      <article className="detail-info"><span className="eyebrow">{item.game} · {item.code}</span><h1>{item.title}</h1><h2>Bs {Number(item.public_price).toFixed(2)}</h2><p className="muted">{item.description}</p><div className="account-notice"><strong>Detalles de la cuenta</strong><p>{item.account_details}</p></div><p className="muted">Vendedor: {item.seller_name}</p><a className="btn primary auth-submit" href={`https://wa.me/${phone}?text=${message}`} target="_blank" rel="noreferrer">Consultar por WhatsApp</a><small className="muted">Verifica los datos y acuerda las condiciones directamente con el vendedor antes de realizar cualquier pago.</small></article>
    </section>
  </main>;
}

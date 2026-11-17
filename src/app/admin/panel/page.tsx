import Link from "next/link";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";
import { adminLogoutAction, updateCommissionAction, updateListingStatusAction } from "@/app/actions/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminListing = { id:string; code:string; game:string; title:string; seller_name:string; seller_email:string; seller_whatsapp:string; seller_price:string; commission_bs:string; public_price:string; status:string; images:string[]; created_at:string };

const labels:Record<string,string>={pending:"Pendiente",approved:"Aprobada / Disponible",reserved:"Reservada",sold:"Vendida",rejected:"Rechazada"};

export default async function AdminPanelPage({searchParams}:{searchParams:Promise<{commissionSaved?:string;commissionError?:string}>}) {
  if (!(await isAdmin())) redirect("/admin");
  await requireAdmin();
  await ensureListingsTable();
  const sql=getDb();
  const listings=await sql`
    SELECT l.id,l.code,l.game,l.title,l.seller_price::text,l.commission_bs::text,l.public_price::text,l.status,l.images,l.created_at,
           u.name AS seller_name,u.email AS seller_email,u.whatsapp AS seller_whatsapp
    FROM listings l JOIN users u ON u.id=l.seller_id ORDER BY
      CASE WHEN l.status='pending' THEN 0 ELSE 1 END, l.created_at DESC
  ` as AdminListing[];
  const setting=await sql`SELECT value FROM app_settings WHERE key='commission_bs' LIMIT 1`;
  const params=await searchParams;
  return <main className="shell admin-page">
    <header className="nav"><Link href="/" className="brand">GAME<span>VAULT</span></Link><form action={adminLogoutAction}><button className="btn">Cerrar panel</button></form></header>
    <section className="catalog-heading"><span className="eyebrow">CENTRO DE CONTROL</span><h1>Panel de administración</h1><p className="muted">Gestiona publicaciones, vendedores, estados y comisión de la plataforma.</p></section>
    <section className="admin-settings">
      <div><h2>Comisión por publicación</h2><p className="muted">Se suma al precio que establece cada vendedor para calcular el precio público de las nuevas publicaciones.</p></div>
      <form action={updateCommissionAction} className="commission-form"><label>Comisión (Bs)<input name="commission" type="number" min="0" max="100000" step="0.01" defaultValue={setting[0]?.value ?? "30"}/></label><button className="btn primary">Guardar comisión</button></form>
      {params.commissionSaved&&<p className="success-message">Comisión actualizada. Se aplicará a las nuevas publicaciones.</p>}
      {params.commissionError&&<p className="form-error">Introduce un importe válido.</p>}
    </section>
    <section className="admin-listings"><div className="section-head"><div><span className="eyebrow">INVENTARIO</span><h2>Publicaciones ({listings.length})</h2></div></div>
      {listings.length===0?<div className="empty-state"><h3>No hay publicaciones todavía</h3><p className="muted">Cuando un vendedor publique una cuenta, aparecerá aquí para su revisión.</p></div>:
      <div className="admin-list">{listings.map(item=><article className="admin-list-card" key={item.id}>
        {item.images?.[0]&&<img src={item.images[0]} alt={item.title}/>}
        <div className="admin-list-main"><span className="eyebrow">{item.game} · {item.code}</span><h3>{item.title}</h3><p className="muted">Vendedor: {item.seller_name} · {item.seller_email}</p><p className="muted">Recibe: Bs {Number(item.seller_price).toFixed(2)} · Comisión: Bs {Number(item.commission_bs).toFixed(2)} · Público: Bs {Number(item.public_price).toFixed(2)}</p><a className="whatsapp-link" href={`https://wa.me/${item.seller_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Contactar por WhatsApp: {item.seller_whatsapp}</a><p><span className={`status-pill status-${item.status}`}>{labels[item.status]??item.status}</span></p>
          <div className="admin-status-actions">
            {(["approved","reserved","sold","rejected","pending"] as const).map(status=><form action={updateListingStatusAction} key={status}><input type="hidden" name="listingId" value={item.id}/><input type="hidden" name="status" value={status}/><button className={status==="approved"?"btn primary":"btn"}>{status==="approved"?"Aprobar":status==="reserved"?"Reservar":status==="sold"?"Marcar vendida":status==="rejected"?"Rechazar":"Pendiente"}</button></form>)}
          </div>
        </div>
      </article>)}</div>}
    </section>
  </main>;
}

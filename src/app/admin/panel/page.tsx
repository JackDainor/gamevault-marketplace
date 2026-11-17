import Link from "next/link";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";
import { adminLogoutAction, createAdminListingAction, updateCommissionAction, updateListingStatusAction } from "@/app/actions/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminListing = { id:string; code:string; game:string; title:string; seller_name:string; seller_email:string; seller_whatsapp:string; seller_price:string; commission_bs:string; public_price:string; status:string; images:string[]; created_at:string };

const labels:Record<string,string>={pending:"Pendiente",approved:"Aprobada / Disponible",reserved:"Reservada",sold:"Vendida",rejected:"Rechazada"};
const createErrors:Record<string,string>={
  game:"Selecciona un juego válido.",
  title:"El título debe tener entre 4 y 120 caracteres.",
  description:"La descripción debe tener entre 20 y 1800 caracteres.",
  details:"Completa los detalles de la cuenta.",
  whatsapp:"Escribe un WhatsApp válido con código de país.",
  price:"Escribe un precio válido.",
  images:"Selecciona entre 1 y 10 imágenes.",
  type:"Solo se permiten imágenes JPG, PNG o WEBP.",
  size:"Cada imagen debe pesar como máximo 1 MB.",
  total:"Las imágenes superan los 4 MB en total.",
  storage:"El almacenamiento de imágenes no está configurado.",
  save:"No se pudo guardar la cuenta. Revisa la conexión e inténtalo otra vez."
};

export default async function AdminPanelPage({searchParams}:{searchParams:Promise<{commissionSaved?:string;commissionError?:string;adminCreated?:string;adminCreateError?:string}>}) {
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

    <section className="admin-create">
      <div className="section-head"><div><span className="eyebrow">INVENTARIO PROPIO</span><h2>Publicar cuenta desde GameVault</h2><p className="muted">Sube cuentas que administra la plataforma. Se publicarán directamente como disponibles, sin pasar por revisión.</p></div></div>
      {params.adminCreated&&<p className="success-message">¡Cuenta publicada! Ya debe aparecer en el catálogo público.</p>}
      {params.adminCreateError&&<p className="form-error">{createErrors[params.adminCreateError]??"No se pudo completar la publicación."}</p>}
      <form action={createAdminListingAction} className="auth-form publish-form admin-create-form">
        <label>Juego
          <select name="game" required defaultValue=""><option value="" disabled>Selecciona un juego</option><option>Free Fire</option><option>Roblox</option><option>Fortnite</option><option>Call of Duty</option><option>Otro</option></select>
        </label>
        <label>Título<input name="title" required minLength={4} maxLength={120} placeholder="Ej. Free Fire con skins evolutivas"/></label>
        <label>Descripción<textarea name="description" required minLength={20} maxLength={1800} rows={3} placeholder="Describe la cuenta y sus características..."/></label>
        <label>Detalles de la cuenta<textarea name="accountDetails" required minLength={5} maxLength={1200} rows={3} placeholder="Nivel, skins, rango, personajes y otros detalles..."/></label>
        <label>WhatsApp de contacto (con código de país)<input name="whatsapp" type="tel" required minLength={8} maxLength={20} placeholder="Ej. +591 70000000"/><small>Este número recibirá las consultas de los compradores para esta publicación.</small></label>
        <label>Precio final para el comprador (Bs)<input name="price" type="number" min="1" max="1000000" step="0.01" required placeholder="Ej. 350"/></label>
        <label>Fotos de la cuenta (1 a 10)<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required/><small>Selecciona las fotos desde la galería del teléfono. JPG, PNG o WEBP; máximo 1 MB por foto y 4 MB en total.</small></label>
        <button className="btn primary auth-submit">Publicar cuenta ahora</button>
      </form>
      <p className="admin-create-note">Las publicaciones del administrador aparecen como “GameVault” y quedan disponibles inmediatamente. El precio que ingreses será el precio final; no se suma la comisión de vendedor.</p>
    </section>

    <section className="admin-listings"><div className="section-head"><div><span className="eyebrow">INVENTARIO</span><h2>Publicaciones ({listings.length})</h2></div></div>
      {listings.length===0?<div className="empty-state"><h3>No hay publicaciones todavía</h3><p className="muted">Cuando un vendedor publique una cuenta, aparecerá aquí para su revisión.</p></div>:
      <div className="admin-list">{listings.map(item=><article className="admin-list-card" key={item.id}>
        {item.images?.[0]&&<img src={item.images[0]} alt={item.title}/>}
        <div className="admin-list-main"><span className="eyebrow">{item.game} · {item.code}</span><h3>{item.title}</h3><p className="muted">Vendedor: {item.seller_name} · {item.seller_email}</p><p className="muted">Recibe: Bs {Number(item.seller_price).toFixed(2)} · Comisión: Bs {Number(item.commission_bs).toFixed(2)} · Público: Bs {Number(item.public_price).toFixed(2)}</p><a className="whatsapp-link" href={`https://wa.me/${item.seller_whatsapp.replace(/\\D/g,"")}`} target="_blank" rel="noreferrer">Contactar por WhatsApp: {item.seller_whatsapp}</a><p><span className={`status-pill status-${item.status}`}>{labels[item.status]??item.status}</span></p>
          <div className="admin-status-actions">
            {(["approved","reserved","sold","rejected","pending"] as const).map(status=><form action={updateListingStatusAction} key={status}><input type="hidden" name="listingId" value={item.id}/><input type="hidden" name="status" value={status}/><button className={status==="approved"?"btn primary":"btn"}>{status==="approved"?"Aprobar":status==="reserved"?"Reservar":status==="sold"?"Marcar vendida":status==="rejected"?"Rechazar":"Pendiente"}</button></form>)}
          </div>
        </div>
      </article>)}</div>}
    </section>
  </main>;
}

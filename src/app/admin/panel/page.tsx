import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { ensureListingsTable, getDb } from "@/lib/db";
import {
  adminLogoutAction,
  createAdminListingAction,
  deleteListingAction,
  updateCommissionAction,
  updateListingAction,
  updateListingStatusAction,
} from "@/app/actions/admin";
import PendingButton from "@/components/pending-button";

export const dynamic = "force-dynamic";

type AdminListing = {
  id:string; code:string; game:string; title:string; description:string; account_details:string;
  seller_name:string; seller_email:string; seller_whatsapp:string; seller_price:string;
  commission_bs:string; public_price:string; status:string; images:string[]; created_at:string; updated_at:string;
};

const labels:Record<string,string>={pending:"Pendiente",approved:"Aprobada / Disponible",reserved:"Reservada",sold:"Vendida",rejected:"Rechazada"};
const createErrors:Record<string,string>={
  game:"Selecciona un juego válido.",title:"El título debe tener entre 4 y 120 caracteres.",
  description:"La descripción debe tener entre 20 y 1800 caracteres.",details:"Completa los detalles de la cuenta.",
  whatsapp:"Escribe un WhatsApp válido con código de país.",price:"Escribe un precio válido.",
  images:"Selecciona entre 1 y 10 imágenes.",type:"Solo se permiten imágenes JPG, PNG o WEBP.",
  size:"Cada imagen debe pesar como máximo 1 MB.",total:"Las imágenes superan los 4 MB en total.",
  storage:"El almacenamiento de imágenes no está configurado.",save:"No se pudo guardar la cuenta. Revisa la conexión e inténtalo otra vez."
};

export default async function AdminPanelPage({searchParams}:{searchParams:Promise<{
  commissionSaved?:string;commissionError?:string;adminCreated?:string;adminCreateError?:string;
  code?:string;edited?:string;deleted?:string;editError?:string;deleteError?:string;
}>}) {
  if (!(await isAdmin())) redirect("/admin");
  await requireAdmin();
  await ensureListingsTable();
  const params=await searchParams;
  const searchCode=(params.code??"").trim().slice(0,30);
  const sql=getDb();
  const listings=await sql`
    SELECT l.id,l.code,l.game,l.title,l.description,l.account_details,l.seller_price::text,
           l.commission_bs::text,l.public_price::text,l.status,l.images,l.created_at,l.updated_at,
           u.name AS seller_name,u.email AS seller_email,u.whatsapp AS seller_whatsapp
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE (${searchCode} = '' OR l.code ILIKE ${"%" + searchCode + "%"})
    ORDER BY CASE WHEN l.status='pending' THEN 0 ELSE 1 END, l.created_at DESC
  ` as AdminListing[];
  const soldListings=await sql`
    SELECT l.id,l.code,l.game,l.title,l.public_price::text,l.updated_at,
           u.name AS seller_name,u.whatsapp AS seller_whatsapp
    FROM listings l JOIN users u ON u.id=l.seller_id
    WHERE l.status='sold' ORDER BY l.updated_at DESC
  `;
  const setting=await sql`SELECT value FROM app_settings WHERE key='commission_bs' LIMIT 1`;

  return <main className="shell admin-page">
    <header className="nav"><Link href="/" className="brand">GAME<span>VAULT</span></Link><form action={adminLogoutAction}><PendingButton pendingText="Cerrando..." className="btn">Cerrar panel</PendingButton></form></header>
    <section className="catalog-heading"><span className="eyebrow">CENTRO DE CONTROL</span><h1>Panel de administración</h1><p className="muted">Gestiona publicaciones, vendedores, estados, comisión e historial de ventas.</p></section>

    <section className="admin-settings">
      <div><h2>Comisión por publicación</h2><p className="muted">Se suma al precio que establece cada vendedor para calcular el precio público de las nuevas publicaciones.</p></div>
      <form action={updateCommissionAction} className="commission-form"><label>Comisión (Bs)<input name="commission" type="number" min="0" max="100000" step="0.01" defaultValue={setting[0]?.value ?? "30"}/></label><PendingButton className="btn primary" pendingText="Guardando...">Guardar comisión</PendingButton></form>
      {params.commissionSaved&&<p className="success-message">Comisión actualizada. Se aplicará a las nuevas publicaciones.</p>}
      {params.commissionError&&<p className="form-error">Introduce un importe válido.</p>}
    </section>

    <section className="admin-create">
      <div className="section-head"><div><span className="eyebrow">INVENTARIO PROPIO</span><h2>Publicar cuenta desde GameVault</h2><p className="muted">Sube cuentas que administra la plataforma. Se publicarán directamente como disponibles, sin pasar por revisión.</p></div></div>
      {params.adminCreated&&<p className="success-message">¡Cuenta publicada! Ya debe aparecer en el catálogo público.</p>}
      {params.adminCreateError&&<p className="form-error">{createErrors[params.adminCreateError]??"No se pudo completar la publicación."}</p>}
      <form action={createAdminListingAction} className="auth-form publish-form admin-create-form">
        <label>Juego<select name="game" required defaultValue=""><option value="" disabled>Selecciona un juego</option><option>Free Fire</option><option>Roblox</option><option>Fortnite</option><option>Call of Duty</option><option>Otro</option></select></label>
        <label>Título<input name="title" required minLength={4} maxLength={120} placeholder="Ej. Free Fire con skins evolutivas"/></label>
        <label>Descripción<textarea name="description" required minLength={20} maxLength={1800} rows={3} placeholder="Describe la cuenta y sus características..."/></label>
        <label>Detalles de la cuenta<textarea name="accountDetails" required minLength={5} maxLength={1200} rows={3} placeholder="Nivel, skins, rango, personajes y otros detalles..."/></label>
        <label>WhatsApp de contacto (con código de país)<input name="whatsapp" type="tel" required minLength={8} maxLength={20} placeholder="Ej. +591 70000000"/><small>Este número recibirá las consultas de los compradores para esta publicación.</small></label>
        <label>Precio final para el comprador (Bs)<input name="price" type="number" min="1" max="1000000" step="0.01" required placeholder="Ej. 350"/></label>
        <label>Fotos de la cuenta (1 a 10)<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required/><small>Selecciona las fotos desde la galería del teléfono. JPG, PNG o WEBP; máximo 1 MB por foto y 4 MB en total.</small></label>
        <PendingButton className="btn primary auth-submit" pendingText="Subiendo fotos y publicando...">Publicar cuenta ahora</PendingButton>
      </form>
      <p className="admin-create-note">Las publicaciones del administrador aparecen como “GameVault” y quedan disponibles inmediatamente. El precio que ingreses será el precio final; no se suma la comisión de vendedor.</p>
    </section>

    <section className="admin-listings">
      <div className="section-head"><div><span className="eyebrow">INVENTARIO</span><h2>Publicaciones ({listings.length})</h2><p className="muted">Busca por el código GV de cualquier publicación para encontrarla rápidamente.</p></div></div>
      <form method="GET" className="admin-search-form"><input name="code" defaultValue={searchCode} placeholder="Ej. GV-A1B2C3D4" aria-label="Buscar por código de publicación"/><button className="btn primary" type="submit">Buscar código</button>{searchCode&&<Link href="/admin/panel" className="btn">Limpiar</Link>}</form>
      {params.edited&&<p className="success-message">Los cambios de la publicación se guardaron correctamente.</p>}
      {params.deleted&&<p className="success-message">La publicación fue eliminada.</p>}
      {params.editError&&<p className="form-error">No se pudieron guardar los cambios. Revisa los campos y vuelve a intentarlo.</p>}
      {params.deleteError&&<p className="form-error">No se pudo eliminar la publicación.</p>}
      {listings.length===0?<div className="empty-state"><h3>{searchCode?"No encontramos ese código":"No hay publicaciones todavía"}</h3><p className="muted">{searchCode?"Comprueba el código GV e inténtalo otra vez.":"Cuando un vendedor publique una cuenta, aparecerá aquí para su revisión."}</p></div>:
      <div className="admin-list">{listings.map(item=><article className="admin-list-card" key={item.id}>
        {item.images?.[0]&&<img src={item.images[0]} alt={item.title}/>}
        <div className="admin-list-main"><span className="eyebrow">{item.game} · {item.code}</span><h3>{item.title}</h3><p className="muted">Vendedor: {item.seller_name} · {item.seller_email}</p><p className="muted">Recibe: Bs {Number(item.seller_price).toFixed(2)} · Comisión: Bs {Number(item.commission_bs).toFixed(2)} · Público: Bs {Number(item.public_price).toFixed(2)}</p><a className="whatsapp-link" href={`https://wa.me/${item.seller_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">Contactar por WhatsApp: {item.seller_whatsapp}</a><p><span className={`status-pill status-${item.status}`}>{labels[item.status]??item.status}</span></p>
          <div className="admin-status-actions">
            {(["approved","reserved","sold","rejected","pending"] as const).map(status=><form action={updateListingStatusAction} key={status}><input type="hidden" name="listingId" value={item.id}/><input type="hidden" name="status" value={status}/><PendingButton className={status==="approved"?"btn primary":"btn"} pendingText="Actualizando...">{status==="approved"?"Aprobar":status==="reserved"?"Reservar":status==="sold"?"Marcar vendida":status==="rejected"?"Rechazar":"Pendiente"}</PendingButton></form>)}
          </div>
          <details className="admin-edit-details"><summary>Editar publicación</summary>
            <form action={updateListingAction} className="admin-edit-form">
              <input type="hidden" name="listingId" value={item.id}/>
              <label>Título<input name="title" required minLength={4} maxLength={120} defaultValue={item.title}/></label>
              <label>Descripción<textarea name="description" required minLength={20} maxLength={1800} rows={3} defaultValue={item.description}/></label>
              <label>Detalles de la cuenta<textarea name="accountDetails" required minLength={5} maxLength={1200} rows={3} defaultValue={item.account_details}/></label>
              <label>WhatsApp<input name="whatsapp" required type="tel" defaultValue={item.seller_whatsapp}/></label>
              <label>Precio base (Bs)<input name="price" required type="number" min="1" max="1000000" step="0.01" defaultValue={item.seller_price}/></label>
              <PendingButton className="btn primary" pendingText="Guardando cambios...">Guardar cambios</PendingButton>
            </form>
          </details>
          <form action={deleteListingAction} className="admin-delete-form"><input type="hidden" name="listingId" value={item.id}/><PendingButton className="btn danger-btn" pendingText="Eliminando...">Eliminar publicación</PendingButton></form>
        </div>
      </article>)}</div>}
    </section>

    <section className="admin-sales">
      <div className="section-head"><div><span className="eyebrow">REGISTRO</span><h2>Historial de ventas ({soldListings.length})</h2><p className="muted">Aquí aparecen las cuentas que marcaste como vendidas desde el panel.</p></div></div>
      {soldListings.length===0?<div className="empty-state"><h3>Aún no hay ventas registradas</h3><p className="muted">Cuando marques una publicación como vendida, se guardará aquí.</p></div>:
        <div className="admin-sales-list">{soldListings.map((sale:any)=><article className="admin-sale-card" key={sale.id}><div><span className="eyebrow">{sale.game} · {sale.code}</span><h3>{sale.title}</h3><p className="muted">Vendedor: {sale.seller_name} · Vendida: {new Date(sale.updated_at).toLocaleString("es-BO")}</p><strong>Bs {Number(sale.public_price).toFixed(2)}</strong></div><Link className="btn primary" href={`/admin/ventas/${sale.id}/comprobante`}>Ver comprobante</Link></article>)}</div>}
    </section>
  </main>;
}

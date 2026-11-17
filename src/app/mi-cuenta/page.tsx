import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import PendingButton from "@/components/pending-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  return <main className="auth-page">
    <section className="auth-card account-card">
      <Link href="/" className="brand">GAME<span>VAULT</span></Link>
      <span className="eyebrow">TU ESPACIO GAMEVAULT</span>
      <h1>¡Hola, {user.name}!</h1>
      <p className="muted">Tu cuenta ya está creada. Desde aquí podrás gestionar tus publicaciones cuando activemos el módulo de ventas.</p>
      <div className="account-details">
        <p><strong>Correo</strong><span>{user.email}</span></p>
        <p><strong>WhatsApp</strong><span>{user.whatsapp}</span></p>
      </div>
      <div className="account-notice"><strong>Tu espacio de vendedor</strong><p>Publica cuentas, consulta el estado de tus anuncios y revisa los precios que verán los compradores.</p></div>
      <Link href="/publicar" className="btn primary">+ Publicar una cuenta</Link>
      <Link href="/mi-cuenta/publicaciones" className="btn" style={{width:"100%",marginTop:10}}>Ver mis publicaciones</Link>
      <Link href="/" className="auth-back" style={{marginTop:18}}>Volver al inicio</Link>
      <form action={logoutAction}><PendingButton className="btn logout-btn" pendingText="Cerrando sesión...">Cerrar sesión</PendingButton></form>
    </section>
  </main>;
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

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
      <div className="account-notice"><strong>Próximo paso</strong><p>Estamos preparando el formulario para publicar cuentas, subir imágenes y consultar el estado de tus anuncios.</p></div>
      <Link href="/" className="btn">Volver al inicio</Link>
      <form action={logoutAction}><button className="btn logout-btn">Cerrar sesión</button></form>
    </section>
  </main>;
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLoginAction } from "@/app/actions/admin";

const initialState = { error: "" };

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);
  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/" className="brand">GAME<span>VAULT</span></Link>
      <span className="eyebrow">ACCESO RESTRINGIDO</span>
      <h1>Administración</h1>
      <p className="muted">Ingresa con la contraseña privada configurada en el servidor.</p>
      <form action={action} className="auth-form">
        <label>Contraseña de administrador<input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña privada" /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="btn primary auth-submit" disabled={pending}>{pending ? "Verificando..." : "Entrar al panel"}</button>
      </form>
      <Link href="/" className="auth-back">← Volver al sitio</Link>
    </section>
  </main>;
}

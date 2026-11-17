"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import PendingButton from "@/components/pending-button";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, initialState);
  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/" className="brand">GAME<span>VAULT</span></Link>
      <span className="eyebrow">QUÉ BUENO VERTE DE NUEVO</span>
      <h1>Iniciar sesión</h1>
      <p className="muted">Accede a tu espacio de vendedor.</p>
      <form action={action} className="auth-form">
        <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="correo@ejemplo.com" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" placeholder="Tu contraseña" /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <PendingButton className="btn primary auth-submit" pendingText="Ingresando...">Entrar</PendingButton>
      </form>
      <p className="auth-switch">¿Todavía no tienes cuenta? <Link href="/registro">Regístrate</Link></p>
      <Link className="auth-back" href="/">← Volver al inicio</Link>
    </section>
  </main>;
}

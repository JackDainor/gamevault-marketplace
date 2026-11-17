"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import PendingButton from "@/components/pending-button";

const initialState = { error: "" };

export default function RegisterPage() {
  const [state, action] = useActionState(registerAction, initialState);
  return <main className="auth-page">
    <section className="auth-card">
      <Link href="/" className="brand">GAME<span>VAULT</span></Link>
      <span className="eyebrow">ÚNETE A LA COMUNIDAD</span>
      <h1>Crea tu cuenta</h1>
      <p className="muted">Regístrate para preparar y gestionar tus publicaciones.</p>
      <form action={action} className="auth-form">
        <label>Nombre completo<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Tu nombre" /></label>
        <label>Correo electrónico<input name="email" type="email" required autoComplete="email" placeholder="correo@ejemplo.com" /></label>
        <label>WhatsApp<input name="whatsapp" required minLength={7} maxLength={30} autoComplete="tel" placeholder="+591 70000000" /></label>
        <label>Contraseña<input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" /></label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <PendingButton className="btn primary auth-submit" pendingText="Creando cuenta...">Crear cuenta</PendingButton>
      </form>
      <p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
      <Link className="auth-back" href="/">← Volver al inicio</Link>
    </section>
  </main>;
}

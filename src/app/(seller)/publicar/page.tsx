"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createListingAction } from "@/app/actions/listings";

const initialState = { error: "" };

export default function PublishPage() {
  const [state, action, pending] = useActionState(createListingAction, initialState);
  const [price, setPrice] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const commission = 30;
  const numericPrice = Number(price) || 0;

  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(files.slice(0, 10).map(file => URL.createObjectURL(file)));
  }

  return <main className="auth-page">
    <section className="publish-card">
      <div className="publish-top"><Link href="/mi-cuenta" className="auth-back">← Mi cuenta</Link><span className="badge">PUBLICACIÓN NUEVA</span></div>
      <span className="eyebrow">VENDE EN GAMEVAULT</span>
      <h1>Publica tu cuenta</h1>
      <p className="muted">Completa los datos con claridad. Tu publicación quedará pendiente de revisión antes de aparecer en el catálogo.</p>
      <form action={action} className="auth-form publish-form">
        <label>Juego
          <select name="game" required defaultValue=""><option value="" disabled>Selecciona un juego</option><option>Free Fire</option><option>Roblox</option><option>Fortnite</option><option>Call of Duty</option><option>Otro</option></select>
        </label>
        <label>Título de la publicación<input name="title" required minLength={4} maxLength={120} placeholder="Ej. Free Fire con varias skins evolutivas" /></label>
        <label>Descripción<textarea name="description" required minLength={20} maxLength={1800} rows={4} placeholder="Describe lo más importante de tu cuenta..." /></label>
        <label>Detalles de la cuenta<textarea name="accountDetails" required minLength={5} maxLength={1200} rows={3} placeholder="Nivel, skins, personajes, rango, accesorios y otros detalles..." /></label>
        <label>Precio que quieres recibir (Bs)<input name="sellerPrice" type="number" min="1" max="1000000" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} placeholder="Ej. 250" /></label>
        <div className="price-breakdown">
          <p><span>Tu precio</span><strong>Bs {numericPrice.toFixed(2)}</strong></p>
          <p><span>Comisión de GameVault</span><strong>Bs {commission.toFixed(2)}</strong></p>
          <p className="price-total"><span>Precio que verá el comprador</span><strong>Bs {(numericPrice + commission).toFixed(2)}</strong></p>
          <small>La comisión actual es de Bs 30 por publicación y puede ajustarse desde la configuración administrativa.</small>
        </div>
        <label>Fotos de la cuenta (1 a 10)<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={handleImages} /><small>Elige desde la galería del teléfono. JPG, PNG o WEBP. Máximo 1 MB por imagen y 4 MB en total.</small></label>
        {previews.length > 0 && <div className="image-preview-grid">{previews.map((src,index)=><img src={src} alt={`Vista previa ${index+1}`} key={src}/>)}</div>}
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="btn primary auth-submit" disabled={pending}>{pending ? "Subiendo fotos y publicando..." : "Enviar para revisión"}</button>
      </form>
      <p className="auth-switch">Al enviar, confirmas que tienes autorización para vender esta cuenta y que la información es correcta.</p>
    </section>
  </main>;
}

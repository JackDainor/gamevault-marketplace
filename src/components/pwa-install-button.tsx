"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) setInstalled(true);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("No se pudo registrar el service worker:", error);
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <button type="button" className="btn install-app-btn" onClick={install} disabled={installed}>
        <Download size={16} />
        {installed ? "Aplicación instalada" : "Instalar aplicación"}
      </button>

      {helpOpen && (
        <div className="install-help-backdrop" onClick={() => setHelpOpen(false)}>
          <section
            className="install-help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="install-help-close" onClick={() => setHelpOpen(false)} aria-label="Cerrar">
              <X size={20} />
            </button>
            <span className="eyebrow">GAMEVAULT EN TU TELÉFONO</span>
            <h2 id="install-help-title">Instala la aplicación</h2>
            <p>Si no apareció la ventana automática, puedes instalar GameVault desde el menú de tu navegador:</p>
            <div className="install-help-step">
              <strong>Android · Chrome</strong>
              <span>Abre el menú ⋮ y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.</span>
            </div>
            <div className="install-help-step">
              <strong>iPhone · Safari</strong>
              <span>Toca Compartir y después “Añadir a pantalla de inicio”.</span>
            </div>
            <button type="button" className="btn primary" onClick={() => setHelpOpen(false)}>Entendido</button>
          </section>
        </div>
      )}
    </>
  );
}

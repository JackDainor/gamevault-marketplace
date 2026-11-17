"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavigationFeedback() {
  const pathname = usePathname();

  useEffect(() => {
    const clear = (link: Element) => {
      link.querySelector(".button-spinner")?.remove();
      link.classList.remove("nav-loading");
      link.removeAttribute("aria-busy");
    };

    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a.btn");
      if (!link || link.getAttribute("target") === "_blank" || link.hasAttribute("download")) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      clear(link);
      link.classList.add("nav-loading");
      link.setAttribute("aria-busy", "true");
      const spinner = document.createElement("span");
      spinner.className = "button-spinner";
      spinner.setAttribute("aria-hidden", "true");
      link.prepend(spinner);

      window.setTimeout(() => clear(link), 8000);
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.querySelectorAll("a.nav-loading").forEach(clear);
    };
  }, [pathname]);

  return null;
}

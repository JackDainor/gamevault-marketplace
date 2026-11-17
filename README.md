# GameVault Marketplace

Marketplace de cuentas de videojuegos construido con Next.js, Neon PostgreSQL y Vercel.

## Stack
- Next.js + TypeScript
- Neon PostgreSQL
- Vercel
- PWA instalable

## Variables de entorno previstas
- `DATABASE_URL`: cadena de conexión pooled de Neon.
- `ADMIN_PASSWORD`: contraseña del panel de administración (solo servidor).
- `AUTH_SECRET`: secreto aleatorio para firmar sesiones.
- `BLOB_READ_WRITE_TOKEN`: token de Vercel Blob para imágenes de publicaciones.

## Desarrollo
```bash
npm install
npm run dev
```

La página de inicio incluye carrusel, categorías, presentación de GameVault, explicación del proceso y mensajes de transparencia. La plataforma no debe prometer una garantía de transacción hasta que el flujo de pagos/entrega y sus condiciones estén implementados.

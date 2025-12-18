# 🚀 Guía de Deployment - BukoCash

Esta guía te ayudará a deployar BukoCash en Netlify de forma rápida y sencilla.

---

## 📋 Pre-requisitos

- Cuenta de Netlify (gratuita): https://app.netlify.com/signup
- Repositorio Git con el código de BukoCash
- Node.js instalado localmente (para testing)

---

## 🎯 Opción 1: Deploy Automático con Netlify CLI

### 1. Instalar Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Login a Netlify

```bash
netlify login
```

### 3. Deploy

```bash
# Build local
npm run build

# Deploy a producción
netlify deploy --prod
```

Sigue las instrucciones interactivas:
- **Publish directory**: `dist`
- Confirma el deploy

---

## 🌐 Opción 2: Deploy vía GitHub (Recomendado)

### 1. Push al Repositorio

```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### 2. Conectar con Netlify

1. Ve a [Netlify](https://app.netlify.com)
2. Click en **"Add new site" → "Import an existing project"**
3. Selecciona tu proveedor de Git (GitHub/GitLab/Bitbucket)
4. Autoriza Netlify y selecciona el repositorio **BUKO-CAHS**

### 3. Configuración del Build

Netlify detectará automáticamente la configuración de `netlify.toml`, pero verifica:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

### 4. Deploy

Click en **"Deploy site"** y espera unos minutos.

---

## ⚙️ Configuración Avanzada

### Variables de Entorno (Opcional)

Si en el futuro integras APIs externas:

1. Ve a **Site settings → Environment variables**
2. Añade tus variables:
   - `GEMINI_API_KEY` (solo si usas AI features)
   - Otras API keys necesarias

### Custom Domain

1. **Site settings → Domain management**
2. Click en **"Add custom domain"**
3. Sigue las instrucciones para configurar DNS

### HTTPS

Netlify provee HTTPS automáticamente con Let's Encrypt.

---

## 🔍 Verificación Post-Deploy

Después del deploy, verifica que:

✅ La app carga correctamente
✅ Todas las rutas funcionan (/, /stats, /settings)
✅ Los modales de Categorías, Cuentas y Presupuestos tienen scroll funcional
✅ PWA es instalable (icono de instalación en el navegador)
✅ Service Worker se registra correctamente
✅ localStorage guarda datos correctamente

---

## 🐛 Troubleshooting

### El build falla

```bash
# Limpia cache y reinstala
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Rutas 404

El archivo `netlify.toml` ya incluye redirects para SPA. Si ves 404s, verifica que `dist` sea el directorio de publicación.

### PWA no se instala

1. Verifica que `manifest.webmanifest` exista en `/dist`
2. Comprueba que HTTPS esté activo
3. Revisa la consola del navegador para errores de Service Worker

### Build muy grande (warning)

El bundle tiene >500KB. Esto es normal para una PWA con todas las dependencias. Para optimizar:

```bash
# Analiza el bundle
npm install -D rollup-plugin-visualizer
# Añade al vite.config.ts
```

---

## 📊 Netlify Features Útiles

### Build Hooks

Crea webhooks para rebuild automático:
**Site settings → Build & deploy → Build hooks**

### Split Testing

Prueba variaciones de tu app:
**Split Testing → Add branch**

### Analytics

Activa analytics (opcional, de pago):
**Analytics → Enable**

### Forms (Futuro)

Si añades formularios de contacto, usa Netlify Forms:
https://docs.netlify.com/forms/setup/

---

## 🎉 Deploy Exitoso

Tu app estará disponible en:
`https://[nombre-aleatorio].netlify.app`

Puedes cambiar el nombre en **Site settings → General → Site details → Change site name**

---

## 📱 Instalación como PWA

Una vez deployada:

**En Mobile (Android/iOS):**
1. Abre la URL en Chrome/Safari
2. Tap en "Añadir a pantalla de inicio"
3. La app se instalará como nativa

**En Desktop (Chrome/Edge):**
1. Abre la URL
2. Click en el icono de instalación en la barra de direcciones
3. Click en "Instalar"

---

## 🔄 Updates

Para actualizar la app:

```bash
git add .
git commit -m "Update: [descripción]"
git push origin main
```

Netlify detectará el push y rebuildeará automáticamente en ~2 minutos.

---

## 📚 Recursos

- [Netlify Docs](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

---

**¿Problemas?** Revisa los logs de build en Netlify:
**Deploys → [último deploy] → Deploy log**

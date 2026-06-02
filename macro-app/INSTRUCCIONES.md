# 🌸 Mis Macros — Cómo instalar y usar desde el celu

## Lo que necesitás (una sola vez desde la compu)

- Node.js instalado → https://nodejs.org (bajá la versión LTS)
- Una cuenta gratis en GitHub → https://github.com
- Una cuenta gratis en Vercel → https://vercel.com (te logueás con GitHub)

---

## Paso 1 — Conseguir tu API Key de Anthropic

1. Andá a https://console.anthropic.com
2. Creá una cuenta (o logueate)
3. En el menú lateral → **API Keys** → **Create Key**
4. Copiá la key (empieza con `sk-ant-...`) y guardala

---

## Paso 2 — Subir el proyecto a GitHub

1. Creá un repositorio nuevo en GitHub (llamalo `macro-tracker`)
2. Subí todos los archivos de esta carpeta al repo

   Desde la terminal (en la carpeta del proyecto):
   ```bash
   git init
   git add .
   git commit -m "primera version 🌸"
   git remote add origin https://github.com/TU_USUARIO/macro-tracker.git
   git push -u origin main
   ```

---

## Paso 3 — Deploy en Vercel

1. Andá a https://vercel.com → **New Project**
2. Importá tu repositorio `macro-tracker`
3. En la sección **Environment Variables** agregá:
   - Name: `VITE_ANTHROPIC_API_KEY`
   - Value: tu key de Anthropic (`sk-ant-...`)
4. Click en **Deploy** → esperá 1-2 minutos
5. Vercel te da una URL tipo: `https://macro-tracker-abc.vercel.app`

---

## Paso 4 — Usar desde el celu 📱

### En iPhone (Safari):
1. Abrí la URL de Vercel en Safari
2. Tocá el ícono de compartir (cuadrado con flecha ↑)
3. → **"Añadir a pantalla de inicio"**
4. Se instala como app con ícono 🌸 en tu pantalla

### En Android (Chrome):
1. Abrí la URL en Chrome
2. Tocá los tres puntitos (⋮)
3. → **"Agregar a pantalla de inicio"**
4. Se instala como app nativa

---

## Paso 5 — Conectar la API Key en la app

Una vez que la app esté deployada, en Vercel las variables de entorno
quedan disponibles automáticamente. Si querés probarla localmente:

1. Creá un archivo `.env` en la raíz del proyecto:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-tu-key-aqui
   ```
2. Corré `npm install` y luego `npm run dev`
3. Abrí http://localhost:5173

---

## ¿La app guarda mis datos?

Sí, todo se guarda en el **localStorage** de tu dispositivo:
- Tu perfil (macros, días de entreno)
- El registro diario de comidas
- El agua y los pasos de cada día
- El historial semanal

No se sube a ningún servidor. Es tuyo 🔒

---

## Costo de uso

- La API de Anthropic cobra por uso
- Para uso diario personal (registrar comidas) es muy barato
- Estimado: ~$0.01 USD por consulta → menos de $10/mes usando varias veces por día


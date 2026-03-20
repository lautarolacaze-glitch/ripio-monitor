# Ripio Monitor

Dashboard profesional de monitoreo para ripio.com. Analiza clases CSS, SEO, performance, custom code y mas mediante scraping server-side con almacenamiento en SQLite.

## Requisitos

- Node.js 18+
- npm

## Instalacion

```bash
git clone https://github.com/tu-usuario/ripio-monitor.git
cd ripio-monitor
npm install
```

## Configuracion

Crear un archivo `.env.local` en la raiz del proyecto:

```env
DASHBOARD_PASSWORD=tu_contraseña_segura
SITE_URL=https://ripio.com
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador. Se redirigira a `/login` donde debes ingresar la contraseña configurada en `.env.local`.

## Build de produccion

```bash
npm run build
npm start
```

## Funcionalidades

- **Overview**: Estado del sitio, score general, historial de escaneos
- **Clases CSS**: Tabla con todas las clases detectadas, frecuencia, paginas donde aparecen
- **Performance**: Metricas de Core Web Vitals via PageSpeed Insights API
- **SEO & Meta Tags**: Analisis de meta tags, headings, OG tags, canonical URLs
- **Problemas**: Issues priorizados por severidad y categoria
- **Custom Code**: Scripts, estilos inline, tracking pixels detectados
- **Estadisticas**: Arbol de navegacion, assets, links internos vs externos
- **Recomendaciones**: Panel auto-generado con checklist de optimizacion
- **Configuracion**: Frecuencia de escaneo, URLs a monitorear, exportar reportes

## Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Base de datos**: SQLite (better-sqlite3)
- **Scraping**: Cheerio
- **Charts**: Recharts
- **Animaciones**: Framer Motion
- **Autenticacion**: Cookie HTTP-only con token

## Seguridad

- Autenticacion por contraseña con cookie HTTP-only
- Rate limiting en endpoints de escaneo
- Validacion de URLs (bloqueo de IPs privadas)
- Security headers (CSP, X-Frame-Options, HSTS, etc.)
- Sanitizacion de inputs

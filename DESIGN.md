# Design System: Asset Maintenance & Management

## Visual Description
Una interfaz profesional, densa en datos y de alta legibilidad, diseñada para entornos operativos. Se prioriza la claridad sobre el adorno, utilizando un lenguaje visual moderno basado en Tailwind CSS con soporte nativo completo para **Dark Mode**.

## Color Palette
El sistema utiliza una paleta semántica basada en la escala de Slates para neutralidad y Blues para acciones primarias.

### Core Colors
- **Primary Actions:** `bg-blue-500` / `#3B82F6` (Botones principales, selección).
- **Surface (Light):** `bg-white` / `bg-slate-50` (Fondos de página).
- **Surface (Dark):** `bg-[#020617]` (Fondo base), `bg-[#0f172a]` (Componentes/Cards).
- **Borders:** `border-slate-200` (Light) / `border-slate-800` (Dark).

### Semantic Accents
- **Success:** Emerald/Green (Estados "Completado" o "Recibido").
- **Warning:** Amber/Orange (Stock bajo, mantenimientos próximos).
- **Danger:** Rose/Red (Eliminación, errores críticos, stock agotado).

## Typography
- **Font Family:** Sans-serif (Inter/System stack).
- **Scale:**
  - **Headings:** Bold, Slate-900 (Light) / White (Dark).
  - **Body:** Regular, Slate-600 (Light) / Slate-300 (Dark).
  - **Data/Monospace:** Utilizado para códigos de activos o IDs cuando es necesario.

## Components
### Sidebar
- Colapsable en móvil.
- Fondo oscuro constante o adaptable según el tema seleccionado.
- Iconografía Lucide consistente.

### Notification Bell
- Ubicación fija en `top-0 right-8` (Z-index 60).
- Punto de alerta rojo para notificaciones pendientes.

### Cards & Tables
- Bordes sutiles sin sombras profundas (estilo Flat/Minimalista).
- Filas de tabla con hover effect suave.

## Iconography
- **Biblioteca:** Lucide React.
- **Estilo:** Trazo fino (2px), tamaño estándar (w-5 h-5 o w-6 h-6).

## Motion
- Transiciones suaves de color de tema (`duration-300`).
- Backdrop blur en modales y overlays móviles.

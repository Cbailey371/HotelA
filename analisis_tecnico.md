# Análisis Técnico - Proyecto HotelA

Este documento proporciona una visión detallada de la arquitectura, tecnologías y lenguajes utilizados en la aplicación HotelA.

## Arquitectura General
La aplicación sigue un modelo de **Arquitectura Desacoplada** con un frontend (SPA) moderno y una API RESTful robusta.

---

## Backend (`hotel_back`)

### Core
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [NestJS](https://nestjs.com/) (v11.1.1)
- **Runtime:** Node.js (v22.15.19) / Compatible con Bun.

### Persistencia de Datos
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/) (v6.8.2) para el mapeo relacional y migraciones.

### Seguridad y Autenticación
- **Passport.js & JWT:** Para la gestión de sesiones y protección de rutas.
- **Cryptr:** Encriptación personalizada para el manejo seguro de contraseñas.
- **CASL:** Gestión de permisos y control de acceso basado en roles (RBAC).

### Integraciones y Utilidades
- **Swagger/OpenAPI:** Documentación interactiva de la API (disponible en `/api`).
- **Supabase SDK:** Integración para almacenamiento de archivos y activos.
- **Class Validator/Transformer:** Validación y transformación automática de datos (DTOs).

---

## Frontend (`hotel_front`)

### Core
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Next.js](https://nextjs.org/) (v15.3.2) utilizando el **App Router**.
- **Gestión de Estado:** [Zustand](https://zustand-demo.pmnd.rs/) (Ligero y eficiente).

### UI / UX (Diseño y Estilos)
- **Framework de Estilos:** [Tailwind CSS](https://tailwindcss.com/) (v3.4.17).
- **Librería de Componentes:** [HeroUI](https://heroui.com/) (anteriormente NextUI).
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/) para una experiencia de usuario fluida.
- **Iconografía:** [Iconify](https://iconify.design/).

### Funcionalidades Específicas
- **Autenticación:** [NextAuth.js](https://next-auth.js.org/).
- **Internacionalización:** [next-intl](https://next-intl-docs.vercel.app/) para soporte multi-idioma.
- **Mapas:** Integración con **Google Maps API**.
- **Calendario:** [React Big Calendar](https://jquense.github.io/react-big-calendar/) para visualización de mantenimientos.

---

## Ecosistema de Desarrollo
- **Gestor de Paquetes:** npm / Bun.
- **Variables de Entorno:** Configuración flexible mediante archivos `.env`.
- **Calidad de Código:** ESLint, Prettier y Jest para pruebas unitarias.

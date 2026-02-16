# PRD - Asset Maintenance & Management

## 1. Resumen Ejecutivo
Asset Maintenance & Management es una plataforma integral de gestión de activos y mantenimiento diseñada específicamente para Empresas que requieran un sistema que lleve sus activos y repuestos. El sistema centraliza la trazabilidad de equipos, la programación de mantenimientos preventivos/correctivos, la gestión de inventario y el ciclo completo de compras para garantizar la continuidad operativa.

## 2. Objetivos del Producto
- **Maximizar la vida útil de los activos:** A través de un riguroso programa de mantenimiento preventivo.
- **Optimizar el Inventario:** Controlar niveles de stock y automatizar alertas de reabastecimiento.
- **Transparencia Operativa:** Ciclo de compras auditable y registro detallado de todas las acciones (Audit Log).
- **Seguridad y Control:** Implementación de RBAC (Role-Based Access Control) para delimitar responsabilidades.

## 3. Módulos y Funcionalidades Principales

### 3.1 Gestión de Activos (Assets)
- Directorio central de equipos con detalles técnicos, fotos y documentos.
- Historial de intervenciones por activo.
- Clasificación por categorías y áreas responsables.

### 3.2 Mantenimiento
- **Calendario Preventivo:** Programación basada en frecuencia (días, meses, años).
- **Órdenes de Trabajo (OT):** Creación y seguimiento de OT correctivas y preventivas.
- **Alertas:** Notificaciones de mantenimientos próximos y activos sin mantenimiento (>3 meses).

### 3.3 Inventario y Almacén
- Control de existencias en tiempo real.
- Alertas de stock crítico (mínimo).
- Trazabilidad de movimientos (entradas/salidas vinculadas a OT o Compras).

### 3.4 Ciclo de Compras (Purchasing)
- **Solicitudes de Compra:** Generación de necesidades por parte de técnicos o almacén.
- **Cotizaciones:** Gestión de ofertas de proveedores.
- **Órdenes de Compra (OC):** Formalización de pedidos.
- **Recepción:** Verificación de mercancía contra OC y actualización automática de inventario.

### 3.5 Administración y Seguridad
- **RBAC:** Roles personalizables (Admin, Técnico, Almacenero, etc.) con permisos granulares.
- **Auditoría:** Registro de creación, edición y eliminación de registros críticos con retención de 30 días.

## 4. Stack Tecnológico
- **Backend:** Rust (Axum, SeaORM, PostgreSQL).
- **Frontend:** React (Vite, Tailwind CSS, Lucide React).
- **Infraestructura:** Docker, Portainer, PostgreSQL.
- **Utilidades:** Envío de correos (Mailer), Generación de PDF (jsPDF), Generación de códigos QR/Barcodes.

## 5. Roles de Usuario
- **Administrador:** Acceso total, configuración del sistema y gestión de usuarios/roles.
- **Almacenero:** Gestión de inventario, recepciones de compra y transferencias.
- **Técnico:** Ejecución de mantenimientos, creación de OT y solicitudes de repuestos.
- **Gerente de Compras:** Aprobación de solicitudes y gestión de proveedores.

---
*Este PRD sirve como base para el desarrollo continuo de Asset Maintenance & Management.*

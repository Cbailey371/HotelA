# manual_05_compras_y_proveedores.md

## 1. Gestión de Proveedores

**Módulo**: Proveedores (dentro de Compras)
**Audiencia**: Compras, Administración

Base de datos de suministradores de servicios y repuestos.

### 1.1. Registro de Proveedores
1.  Vaya a **Compras > Proveedores**.
2.  Clic en **"+ Nuevo Proveedor"**.
3.  Datos fiscales y de contacto:
    -   Razón Social / RUC.
    -   Contacto comercial (Teléfono, Email).
    -   Dirección.
    -   Categoría (Servicios, Repuestos, Ambos).

---

## 2. Ciclo de Compras

El sistema maneja un flujo de tres pasos: Solicitud -> Orden -> Recepción.

### 2.1. Solicitud de Compra (Requisición)
Cualquier usuario autorizado puede pedir materiales.

1.  Vaya a **Compras > Solicitudes**.
2.  Clic en **"+ Nueva Solicitud"**.
3.  Indique:
    -   **Motivo**: Justificación (ej. "Stock crítico de luminarias").
    -   **Prioridad**: Normal o Urgente.
    -   **Ítems**: Liste qué necesita (descripción libre o referencia).
4.  Estado Inicial: **PENDIENTE**.

### 2.2. Aprobación y Generación de OC
El Jefe de Compras o Gerente revisa las solicitudes.

1.  Abra una Solicitud Pendiente.
2.  **Decisión**:
    -   **Rechazar**: Se cierra el flujo.
    -   **Aprobar**: Habilita el paso siguiente.
3.  **Generar Orden de Compra (OC)**:
    -   Clic en "Generar OC".
    -   Seleccione al **Proveedor** adjudicado.
    -   El sistema copia los ítems. Ahora debe ingresar los **Precios Pactados** y cantidades finales.
    -   Guarde. Se genera una OC formal (ej. `OC-2024-889`).

### 2.3. Envío de OC
Puede descargar la OC en formato PDF para enviarla por correo al proveedor. El documento incluye logo de la empresa, datos del proveedor, detalle de ítems, impuestos y términos de pago.

### 2.4. Recepción de Mercadería
Cuando llega el camión del proveedor:

1.  Busque la **Orden de Compra** (Estado "Enviada" o "Pendiente").
2.  Clic en **"Recibir Ítems"**.
3.  Coteje el remito/factura con la OC.
4.  Ingrese las **Cantidades Recibidas** para cada ítem.
    -   *Recepción Parcial*: Si no llegó todo, la OC queda "Abierta" esperando el resto.
    -   *Recepción Total*: Si llegó todo, la OC pasa a **"Completada/Cerrada"**.
5.  **Impacto Automático**: Al guardar la recepción, el inventario de estos ítems **aumenta** automáticamente en la bodega seleccionada.

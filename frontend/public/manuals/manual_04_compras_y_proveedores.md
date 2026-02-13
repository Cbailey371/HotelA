# manual_04_compras_y_proveedores.md

## 1. Gestión de Proveedores

**Módulo**: Proveedores (dentro de Compras)
**Audiencia**: Compras, Administración

Base de datos de suministradores de servicios y repuestos.

### 1.1. Configuración de Compras

Antes de registrar proveedores u órdenes de compra, asegúrese de tener:

*   **Términos de Pago**: Define las condiciones comerciales (ej. Contado, 15 días, 30 días Crédito).

### 1.2. Registro de Proveedores
1.  Vaya a **Compras > Proveedores**.
2.  Clic en **"+ Nuevo Proveedor"**.
3.  Datos fiscales y de contacto:
    -   Razón Social / RUC.
    -   Contacto comercial (Teléfono, Email).
    -   Dirección.
    -   Categoría (Servicios, Repuestos, Ambos).

---

## 2. Ciclo de Compras e Inventario

El sistema maneja un flujo flexible: Solicitud -> Cotización -> Orden -> Factura/Recepción.

### 2.1. Solicitudes de Cotización (RFQ)
Cuando necesita comparar precios o solicitar presupuestos antes de comprar.

1.  Vaya a **Compras > Solicitudes de Cotización**.
2.  Clic en **"+ Nueva Solicitud"**.
3.  Complete los ítems y cantidades requeridas.
4.  **Envío Externo**: 
    -   Desde la lista, use el botón de **"Enviar por Correo"**.
    -   Permite enviar el PDF de la solicitud a uno o varios correos del proveedor (separados por coma).
    -   > [!NOTE]
    -   > El sistema envía automáticamente una copia oculta (CC) al correo del usuario que realiza el envío para su seguimiento.
5.  **Conversión a OC**: 
    -   Una vez que el proveedor responde, puede usar el botón **"Convertir a Orden de Compra"** en las solicitudes con estado "ENVIADA".
    -   Esto abrirá el formulario de Nueva OC precargado con el proveedor y los ítems, permitiéndole ajustar precios finales antes de guardar.

### 2.2. Órdenes de Compra (OC)
Documento de compromiso de compra con un proveedor específico.

1.  **Generación**: Puede crearla desde cero o desde una solicitud previa (ver punto 2.1.5).
2.  **Envío**: 
    -   Use el botón **"Enviar por Correo"** para enviar formalmente la orden al proveedor. 
    -   Al igual que en las RFQ, recibirá una copia automática en su correo personal.
3.  **Estado**: Una vez enviada, queda en estado "ENVIADA" a la espera de la mercadería.

### 2.3. Facturas de Compra y Recepción
Este es el paso final que oficializa el ingreso del gasto y del stock. El sistema utiliza una **pantalla única** para simplificar este proceso.

#### A. Registro desde Orden de Compra (Flujo Unificado)
1.  Busque la OC correspondiente en el listado.
2.  Clic en **"Recibir Mercancía"**.
3.  **Datos de Factura**: Ingrese el número de factura del proveedor, la fecha de emisión y notas si existen.
4.  **Validación de Costos**: El sistema muestra el costo unitario pactado en la OC. Usted puede **ajustar el costo** si hubo variaciones en la factura final.
5.  **Cantidades y Destino**: 
    -   Indique la cantidad real recibida en la columna "Ingresar Ahora".
    -   Seleccione la **Bodega y Ubicación** física exacta para cada ítem.
6.  **Cálculo Automático**: Verifique que el subtotal e impuestos coincidan con su documento físico en la barra de totales inferior.
7.  **Finalizar**: Al hacer clic en **"Finalizar Recepción"**, el sistema registra la factura contable y carga el stock al inventario automáticamente.

> [!NOTE]
> **Recepciones Parciales**: Si solo llega una parte de los ítems, ingrese solo lo recibido. La OC quedará con estado de recepción "PARCIAL" y podrá realizar nuevas recepciones hasta completar el pedido.

#### B. Registro Directo (Sin OC previa)
1.  Vaya a **Facturas de Compra**.
2.  Clic en **"+ Nueva Factura Directa"**.
3.  Seleccione el proveedor, bodega e ingrese los ítems manualmente. Esto es ideal para compras menores o gastos urgentes.

#### C. Control y Reversión
> [!IMPORTANT]
> **Gestión de Errores**: Solo los usuarios con rol **SUPER-ADMIN** pueden "Eliminar/Revertir" una factura recibida. Esto devolverá el stock al estado anterior (restándolo del inventario) y anulará el movimiento contable.

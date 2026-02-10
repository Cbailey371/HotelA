# manual_04_inventario_y_repuestos.md

## 1. Gestión de Inventario

**Módulo**: Inventario
**Audiencia**: Bodegueros, Jefes de Compras

Control total de repuestos, consumibles y herramientas. El sistema gestiona existencias multi-bodega y ubicación física exacta.

### 1.1. Catálogo de Repuestos
Antes de tener stock, debe existir la ficha de la parte.

**Crear Nuevo Repuesto:**
1.  Menú **Inventario**.
2.  Clic en **"+ Nuevo Ítem"**.
3.  Datos Clave:
    -   **Nombre**: Descripción clara (ej. "Filtro de Aceite 5W30").
    -   **SKU / Código**: Código interno o del fabricante (ej. `FIL-001`).
    -   **Categoría**: Eléctrico, Mecánico, Plomería, Insumos.
    -   **Unidad**: Pieza, Litro, Metro, Caja.
    -   **Stock Mínimo / Máximo**: Niveles para alertas de re-compra.
    -   **Ubicación**: Pasillo, Estante, Nivel (ej. "A-04-B").

### 1.2. Movimientos de Stock
El stock nunca se edita "a mano" (salvo ajustes), se mueve por transacciones.

#### A. Entradas (Compras)
-   Se generan automáticamente al **Recibir una Orden de Compra** (ver Manual 05).
-   Aumentan la cantidad disponible y actualizan el Costo Promedio.

#### B. Salidas (Consumo)
-   Se generan automáticamente al **Cerrar una Orden de Trabajo** (ver Manual 03).
-   El técnico indica qué usó y el sistema lo descuenta.

#### C. Ajustes Manuales (Auditoría)
Si el conteo físico no coincide con el sistema:
1.  En la ficha del repuesto, clic en **"Ajustar Stock"**.
2.  Seleccione tipo: "Entrada por Ajuste" o "Salida por Ajuste".
3.  Ingrese la cantidad real y una **Justificación Obligatoria** (ej. "Rotura en almacén", "Conteo cíclico").
4.  Esta acción queda registrada en auditoría.

### 1.3. Alertas de Stock Bajo
El sistema monitorea niveles automáticamente.
-   En el listado, los ítems con **Stock < Mínimo** aparecerán resaltados en **Rojo/Ámbar**.
-   Utilice el filtro "Por Reponer" para generar su lista de compras semanal.

### 1.4. Importación/Exportación
Al igual que los activos, puede cargar su catálogo inicial desde Excel masivamente usando la opción **"Importar"** y la plantilla CSV provista.

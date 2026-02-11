# manual_02_inventario_y_repuestos.md

## 1. Gestión de Inventario

**Módulo**: Inventario
**Audiencia**: Bodegueros, Jefes de Compras

Control total de repuestos, consumibles y herramientas. El sistema gestiona existencias multi-bodega y ubicación física exacta.

### 1.1. Requisitos de Almacenamiento

Antes de ingresar repuestos al inventario, es obligatorio configurar:

*   **Bodegas**: Registre los almacenes principales (ej. Bodega Central, Taller de Mantenimiento).
*   **Ubicaciones**: Defina las estanterías o racks dentro de cada bodega (ej. Pasillo A, Estante 01).

### 1.2. Catálogo de Repuestos
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

### 1.3. Movimientos de Stock
El stock nunca se edita "a mano" (salvo ajustes), se mueve por transacciones.

#### A. Entradas (Compras)
-   Se generan automáticamente al **Recibir una Orden de Compra** (ver Manual 04).
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

### 1.4. Alertas de Stock Bajo
El sistema monitorea niveles automáticamente.
-   En el listado, los ítems con **Stock < Mínimo** aparecerán resaltados en **Rojo/Ámbar**.
-   Utilice el filtro "Por Reponer" para generar su lista de compras semanal.

### 1.5. Importación de Repuestos (Manual o Masiva)

Existen dos formas de ingresar repuestos al sistema: manual o masiva.

#### A. Creación Manual
1.  Navegue al menú **Inventario**.
2.  Haga clic en **"+ Nuevo Ítem"**.
3.  Llene la ficha técnica como se describe en la sección 1.2 y guarde.

#### B. Importación Masiva (Excel/CSV)
Para cargas iniciales de cientos de repuestos:
1.  En la pantalla de Inventario, haga clic en **"Plantilla"** para descargar el archivo base en formato CSV.
2.  Una vez descargada la plantilla, llénela respetando las columnas (no cambie los encabezados).
3.  Para subir el archivo completado, haga clic en **"Importar CSV"**.
4.  Seleccione su archivo desde su PC.
5.  El sistema validará y creará todos los repuestos automáticamente.

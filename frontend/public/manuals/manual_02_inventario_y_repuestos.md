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
    -   **SKU / Código**: Código único de identificación (Stock Keeping Unit). Indispensable para el escaneo y control de inventario.
    -   **Categoría**: Eléctrico, Mecánico, Plomería, Insumos.
    -   **Unidad**: Pieza, Litro, Metro, Caja.
    -   **Stock Mínimo / Máximo**: Niveles para alertas de re-compra.
    -   **Ubicación**: Pasillo, Estante, Nivel (ej. "A-04-B").

### 1.3. Compatibilidad con Activos (Equipos)
A diferencia de versiones anteriores, un mismo repuesto puede estar vinculado a **múltiples activos**.
-   En la ficha del repuesto, utilice el selector de **"Activos Relacionados"**.
-   Puede buscar y añadir todos los equipos que utilicen esa misma parte.
-   Esto facilita la búsqueda de repuestos específicos cuando se está trabajando en una Orden de Trabajo de un equipo particular.

### 1.4. Movimientos de Stock
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

#### B. Importación y Actualización Masiva (Excel/CSV)

El módulo de inventario permite la carga y actualización masiva de repuestos mediante archivos CSV, ideal para cargas iniciales o ajustes de stock y precios.

##### 1. Importar Nuevos Repuestos (Alta)
Para ingresar referencias que **no existen** en el catálogo:

1.  Haga clic en el botón **"Importar"** en la cabecera.
2.  Asegúrese de estar en la pestaña **"Importar Nuevos"**.
3.  Descargue la plantilla **"Descargar CSV (Nuevos)"**.
4.  Complete los datos requeridos (Nombre, Categoría, Stock Inicial, etc.).
    *   El sistema generará automáticamente el código interno.
5.  Suba el archivo en la zona de carga para registrar los ítems.

##### 2. Actualizar Inventario (Modificación)
Para cambios masivos en stock, precios, ubicaciones o detalles de ítems **existentes**:

1.  Haga clic en **"Importar"** y seleccione la pestaña **"Actualizar Existentes"**.
2.  Descargue la plantilla **"Descargar CSV (Actualización)"**.
    *   Este archivo incluirá sus repuestos actuales con sus identificadores únicos (`sku` o `codigo_repuesto`).
3.  Edite los valores que desea actualizar (ej. corregir precios, ajustar ubicaciones detalladas).
    *   **Crucial**: Mantenga intacta la columna `sku` o identificador, ya que es el vínculo para la actualización.
4.  Suba el archivo guardado. El sistema buscará cada ítem por su código y actualizará únicamente los campos modificados.

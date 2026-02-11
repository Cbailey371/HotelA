# manual_01_gestion_de_activos.md

## 1. Gestión de Activos y Equipos

**Módulo**: Activos
**Audiencia**: Técnicos, Jefes de Mantenimiento, Administradores

Este es el corazón del sistema. Aquí se registra y gestiona todo el inventario de maquinaria, equipos e instalaciones del hotel. Cada activo es la base para la planificación del mantenimiento.

### 1.1. Configuración Inicial Requerida

Antes de registrar su primer activo, asegúrese de haber configurado los siguientes catálogos en el menú **Configuración**:

*   **Categorías de Activos**: Define grupos como Climatización, Electricidad, Obra Civil, etc.
*   **Tipos de Activos**: Especifica si es Maquinaria, Mobiliario, Herramientas, etc.
*   **Ubicaciones de Activo**: Define las áreas físicas (ej. Sótano 1, Azotea, Habitación 101).
*   **Marcas**: Registre las marcas de sus fabricantes (ej. Carrier, Caterpillar, Samsung).

> [!IMPORTANT]
> Tener estos datos listos agiliza el registro y permite generar reportes precisos por área o tipo de equipo.

### 1.2. Alta de Activos (Creación)

Existen dos formas de ingresar activos al sistema: manual o masiva.

#### A. Creación Manual (Uno a uno)
1.  Vaya al menú **Activos**.
2.  Haga clic en **"+ Nuevo Activo"**.
3.  Complete la ficha técnica:
    -   **Nombre**: Nombre descriptivo (ej. "Generador Eléctrico Principal").
    -   **Código**: El sistema sugerirá uno (ej. `ACT-0023`), puede modificarlo si usa etiquetas propias.
    -   **Marca / Modelo / Serie**: Datos vitales para garantías y repuestos.
    -   **Ubicación**: Dónde se encuentra físicamente (ej. "Sótano 1", "Azotea").
    -   **Categoría**: Tipo de equipo (ej. "Climatización", "Plomería").
    -   **Fecha de Compra / Costo**: Información contable opcional.
    -   **Estado Inicial**: Generalmente "Operativo".
4.  **Imagen**: Puede subir una foto del equipo para fácil identificación.
5.  Haga clic en **"Guardar"**.

#### B. Importación Masiva (Excel/CSV)
Para cargas iniciales de cientos de equipos:
1.  En la pantalla de Activos, haga clic en **"Plantilla"** para descargar el archivo base en formato CSV.
2.  Una vez descargada la plantilla, llénela respetando las columnas (no cambie los encabezados).
3.  Para subir el archivo completado, haga clic en **"Importar CSV"**.
4.  Seleccione su archivo desde su PC.
5.  El sistema validará y creará todos los activos automáticamente.

### 1.2. Expediente Digital del Activo
Al hacer clic en el ícono de **"Ojo" (Ver Detalle)** de un activo, accede a su expediente completo:

-   **Información General**: Resumen de sus datos técnicos y foto.
-   **Historial de Mantenimiento**: Lista cronológica de todas las OT (Órdenes de Trabajo) realizadas a este equipo.
-   **Documentación Adjunta**: Área para subir PDFs como:
    -   Manuales de Usuario.
    -   Planos técnicos.
    -   Pólizas de Garantía.
    -   Facturas de compra.

**Para subir un documento:**
1.  En la pestaña "Documentos", clic en "Subir".
2.  Seleccione el archivo PDF de su computadora.
3.  Asigne un nombre descriptivo (ej. "Manual de Servicio 2024").

### 1.3. Actualización de Estado y Ubicación
Los activos se mueven o cambian de estado.

1.  Busque el activo y haga clic en **"Editar"**.
2.  **Cambio de Ubicación**: Si el equipo fue trasladado, actualice el campo "Ubicación".
3.  **Cambio de Estado**:
    -   **Operativo**: Funcionando correctamente.
    -   **En Reparación**: Actualmente intervenido o averiado.
    -   **Fuera de Servicio**: No funciona, esperando decisión.
    -   **Baja**: Desechado o vendido (El activo no se borra, queda como histórico).

### 1.4. Generación de Códigos QR

Esta funcionalidad permite imprimir etiquetas para pegar en los equipos.

1.  Desde el detalle del activo, haga clic en el icono de **Configuración** (engranaje).
2.  Busque la opción **"Imprimir Etiqueta QR"**.
3.  Se generará una vista previa con el código QR que vincula directamente a la ficha del activo en el sistema.
4.  Pulse **"Imprimir"** para generar la etiqueta física.

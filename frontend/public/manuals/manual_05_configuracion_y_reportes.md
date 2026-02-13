# manual_05_configuracion_y_reportes.md

## 1. Reportes Inteligentes

**Módulo**: Reportes
**Audiencia**: Gerencia, Jefatura

Visualice la salud operativa del hotel.

### 1.1. Tipos de Reportes
-   **Resumen de Activos**: Valoración total, distribución por estado y categoría.
-   **Mantenimiento**: Cumplimiento del plan (Programado vs Realizado), costos por activo.
-   **Inventario**: Valor del stock actual, rotación de ítems, históricos de consumo.
-   **Sugerido de Compra**: Listado automático de repuestos cuyo stock actual es menor o igual al stock mínimo configurado. Ideal para planificación de compras.

### 1.2. Programación y Vista Previa
Además de generar reportes al instante, puede programar envíos periódicos:
1.  **Vista Previa**: Antes de guardar una programación, use el botón **"Ver Vista Previa"**. Esto cargará los datos reales en la tabla de fondo para que pueda validar la información que se enviará.
2.  **Guardar**: Una vez validado, asigne un nombre, frecuencia y destinatarios para automatizar el reporte.

### 1.3. Filtros y Exportación
Todos los reportes permiten:
-   Filtrar por rango de fechas.
-   Filtrar por departamento o categoría.
-   **Exportar a Excel/PDF** para presentaciones de directorio.

---

## 2. Configuración del Sistema

**Módulo**: Configuración
**Audiencia**: Super-Administradores

### 2.1. Datos de la Empresa
Configure aquí lo que aparecerá en los encabezados de los PDF (OC, OT):
-   Nombre de la Empresa.
-   Logo corporativo.
-   Dirección y RUC.
-   Configuración de Impuestos (ITBMS).

### 2.2. Configuración de Correo (SMTP)
Para que el sistema envíe notificaciones (recuperación de clave, avisos de asignación):
1.  Ingrese los datos de su servidor SMTP (Host, Puerto, Usuario, Password).
2.  Use el botón "Probar Conexión" para verificar.

---

## 3. Respaldo y Recuperación (Backups)

**Módulo**: Configuración > Respaldo
**Audiencia**: Sistemas / TI

Garantice la seguridad de sus datos ante fallos críticos.

### 3.1. Generar Respaldo (Backup)
1.  Vaya a la pestaña **"Respaldo"**.
2.  Clic en **"Exportar Base de Datos"**.
3.  El sistema generará un archivo `.json` encriptado con toda la información (Activos, Usuarios, Históricos).
4.  El archivo se descargará automáticamente a su computadora (ej. `backup_hotela_20240209.json`).
5.  **Recomendación**: Guarde este archivo en una ubicación segura externa (Nube, Disco Externo) semanalmente.

### 3.2. Restaurar Sistema (Restore)
*Advertencia: Esta acción reemplaza los datos actuales.*
1.  En la pestaña "Respaldo", sección "Importar".
2.  Seleccione un archivo de respaldo válido (`.json`).
3.  Confirme la operación.
4.  El sistema procesará la restauración y le notificará al finalizar. Deberá volver a iniciar sesión.

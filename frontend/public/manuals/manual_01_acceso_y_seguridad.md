# manual_01_acceso_y_seguridad.md

## 1. Introducción y Acceso al Sistema

### 1.1. Inicio de Sesión
Para acceder al sistema HotelA, todo usuario debe autenticar su identidad.

**Pasos:**
1.  Ingrese a la dirección web del sistema.
2.  Visualizará la pantalla de Login con el logo de la empresa.
3.  Ingrese su **Nombre de Usuario** y **Contraseña**.
4.  Haga clic en el botón **"Iniciar Sesión"**.

**Notas:**
-   El sistema distingue entre mayúsculas y minúsculas.
-   Si olvida su contraseña, contacte a un Administrador.
-   Su sesión expirará automáticamente tras un periodo de inactividad por seguridad.

### 1.2. Interfaz Principal
Una vez dentro, encontrará:
-   **Barra Lateral (Menú)**: Acceso a todos los módulos (Activos, Mantenimiento, Inventario, etc.) según sus permisos.
-   **Área de Trabajo**: Donde se realizan las tareas.
-   **Barra Superior**: Información del usuario actual, botón de logout y cambio de tema (Claro/Oscuro).

---

## 2. Gestión de Usuarios

**Módulo**: Configuración -> Usuarios
**Audiencia**: Administradores

Este módulo permite dar de alta, modificar o desactivar el acceso del personal al sistema.

### 2.1. Crear Nuevo Usuario
1.  Navegue a **Configuración > Usuarios**.
2.  Haga clic en el botón **"+ Nuevo Usuario"**.
3.  Complete el formulario:
    -   **Nombre Completo**: Nombre real del empleado.
    -   **Usuario**: Identificador único para login (ej. `jdoe`).
    -   **Correo Electrónico**: Para notificaciones y recuperación.
    -   **Contraseña**: Asigne una contraseña temporal segura.
    -   **Rol**: Seleccione el nivel de acceso (ver Sección 3).
4.  Haga clic en **"Guardar"**.

### 2.2. Editar Usuario
1.  En la lista de usuarios, localice al usuario.
2.  Haga clic en el icono de **Lápiz (Editar)**.
3.  Modifique los datos necesarios (ej. cambio de rol o corrección de nombre).
4.  Para cambiar contraseña, déjelo en blanco si no desea modificarla.
5.  Guarde los cambios.

### 2.3. Desactivar Usuario
En lugar de borrar usuarios (lo cual rompería el historial de auditoría), se recomienda **desactivarlos**.
1.  Edite el usuario.
2.  Cambie el estado de "Activo" a "Inactivo".
3.  El usuario ya no podrá iniciar sesión, pero sus registros históricos permanecerán.

---

## 3. Roles y Permisos

**Módulo**: Configuración -> Roles
**Audiencia**: Administradores

El sistema utiliza un control de acceso basado en roles (RBAC).

### 3.1. Roles Predefinidos
-   **SUPER-ADMIN**: Acceso total a todas las funciones, incluyendo configuración crítica y auditoría.
-   **ADMIN**: Acceso de gestión (Activos, Mantenimiento, Inventario, Usuarios), pero sin acceso a configuraciones de sistema profundo.
-   **USUARIO**: Acceso operativo limitado (Ver tareas, ejecutar mantenimientos, solicitar compras). No puede crear usuarios ni borrar registros críticos.

---

## 4. Auditoría del Sistema

**Módulo**: Auditoría
**Audiencia**: Super-Administradores

El módulo de auditoría registra **quién** hizo **qué** y **cuándo**, garantizando la trazabilidad de todas las acciones críticas.

### 4.1. Visualizar Logs
1.  Acceda al menú **Auditoría**.
2.  Verá una tabla cronológica con:
    -   **Fecha/Hora**: Momento exacto de la acción.
    -   **Usuario**: Quién realizó la acción.
    -   **Acción**: Tipo de evento (LOGIN, CREATE, UPDATE, DELETE).
    -   **Módulo**: Área afectada (ej. AUTH, ASSETS, INVENTORY).
    -   **Detalle**: Descripción técnica del cambio.
    -   **IP**: Dirección IP desde donde se conectó.

### 4.2. Filtrado y Búsqueda
Use los filtros superiores para investigar incidentes:
-   **Por Usuario**: Para ver toda la actividad de un empleado específico.
-   **Por Módulo**: Para ver todos los cambios en Activos o Inventario.
-   **Por Fecha**: Para acotar la búsqueda a un incidente reciente.

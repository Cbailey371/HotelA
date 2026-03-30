# manual_06_acceso_y_seguridad.md

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
-   **Barra Lateral (Menú Acordeón)**: Los módulos están agrupados por categorías (Mantenimiento, Logística, Compras, Configuración). Haga clic en el encabezado de un grupo para expandir sus opciones.
-   **Auto-expansión**: El menú detecta automáticamente en qué módulo se encuentra y expande el grupo correspondiente.
-   **Área de Trabajo**: Donde se realizan las tareas.
-   **Barra Superior**: Información del usuario actual, botón de logout y cambio de tema (Claro/Oscuro).
-   **Centro de Notificaciones (Campana)**: Localizada en la barra lateral o superior. Proporciona alertas críticas en tiempo real.

### 1.3. Redirección Inteligente y Dashboard
El acceso al sistema es dinámico según sus permisos:
*   **Permiso `acceso_dashboard`**: Solo los usuarios con este permiso verán el panel de indicadores al entrar.
*   **Redirección Automática**: Si no tiene acceso al Dashboard, el sistema lo llevará automáticamente al **primer módulo** al que tenga permiso (ej. Recepción irá directo al Portal de Solicitudes).

### 1.4. Centro de Notificaciones
El sistema monitorea constantemente el estado de la operación y genera alertas preventivas:

*   **Stock Crítico**: Notifica cuando un repuesto alcanza el stock mínimo definido por el usuario.
*   **Mantenimientos Próximos**: Avisa sobre tareas preventivas programadas para los siguientes 7 días.
*   **Activos Desatendidos**: Señala equipos que no han recibido mantenimiento en más de 3 meses.
*   **Gestión Operativa**: Incluye avisos sobre Órdenes de Trabajo atrasadas, solicitudes de compra pendientes y garantías de equipos próximas a vencer.

> [!TIP]
> Haga clic en una notificación para navegar directamente al módulo correspondiente y resolver la alerta.

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
3. Modifique los datos necesarios (ej. cambio de rol o corrección de nombre).
4. Para cambiar contraseña, déjelo en blanco si no desea modificarla.
5. Guarde los cambios.

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
-   **SUPER-ADMIN**: Acceso total y absoluto a todas las funciones, incluyendo configuraciones críticas de sistema, auditoría avanzada y gestión de todos los módulos.
-   **ADMINISTRADOR**: Acceso de gestión completa (Activos, Mantenimiento, Inventario, Usuarios). Es el rol principal para la administración operativa del hotel.
-   **ALMACENERO**: Rol especializado para el control de suministros. Incluye gestión de inventario, ajustes de stock, marcas, ubicaciones y recepción de mercancía de compras.
-   **SUPERVISOR**: Rol de supervisión operativa. Permite visualizar activos, órdenes de trabajo, planes de mantenimiento e inventario, además de generar y exportar todos los reportes y ver la auditoría del sistema.
-   **TECNICO**: Acceso enfocado a la ejecución de tareas. Puede ver y ejecutar mantenimientos, gestionar órdenes de trabajo y visualizar repuestos.

### 3.2. Granularidad de Permisos
Cada rol está compuesto por permisos específicos (ej. `work_orders_close`, `inventory_adjust`, `invoices_view`). Un Administrador puede crear nuevos roles personalizados combinando estos permisos según la necesidad de la empresa.

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

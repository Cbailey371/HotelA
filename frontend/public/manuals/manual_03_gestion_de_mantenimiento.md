# manual_03_gestion_de_mantenimiento.md

## 1. Gestión de Mantenimiento

**Módulo**: Mantenimiento
**Audiencia**: Jefes de Mantenimiento, Planificadores

Este módulo permite pasar de un mantenimiento reactivo a uno **preventivo**.

### 1.1. Configuración Previa

Para que el calendario y las órdenes de trabajo funcionen correctamente, debe definir:

*   **Tipos de Tareas**: Define las actividades estándar (ej. Inspección, Cambio de Aceite, Limpieza, Calibración).
*   **Técnicos**: Registre al personal que ejecutará las tareas (ver Sección 3 de este manual).

### 1.2. Planificación (Calendario)
La base del preventivo es la programación recurrente.

**Crear una Tarea Programada:**
1.  Vaya a **Mantenimiento > Calendario**.
2.  Clic en **"+ Nueva Programación"**.
3.  Defina:
    -   **Título**: Qué se va a hacer (ej. "Cambio de Filtros AHU-01").
    -   **Activo**: Seleccione el equipo asociado.
    -   **Tipo**: Preventivo, Correctivo, Predictivo.
    -   **Frecuencia**:
        -   *Única*: Para reparaciones puntuales.
        -   *Recurrente*: Diaria, Semanal, Mensual, Anual.
    -   **Asignado a**: Técnico interno o Proveedor externo.
    -   **Fecha de Inicio**: Cuándo debe ejecutarse la primera vez.

El sistema generará automáticamente las proyecciones futuras en el calendario.

### 1.2. Gestión de Feriados (Panamá)
El planificador tiene en cuenta los días no laborables configurados.

**Configurar Feriados:**
1.  Vaya a **Configuración > Feriados**.
2.  Verá la lista de feriados nacionales cargados.
3.  Puede agregar días libres locales o específicos de la empresa.
4.  **Impacto**: Las tareas preventivas automáticas evitarán programarse en estos días si así se configura la regla de negocio.

---

## 2. Órdenes de Trabajo (OT)

**Módulo**: Órdenes de Trabajo
**Audiencia**: Técnicos, Jefes de Mantenimiento

La Orden de Trabajo (OT) es el documento formal que autoriza y registra la ejecución de una tarea.

### 2.1. Generar OT desde Calendario
1.  En el Calendario, haga clic en una tarea programada pendiente.
2.  Seleccione **"Generar Orden de Trabajo"**.
3.  El sistema creará una OT oficial (ej. `OT-2024-0056`) y cambiará el estado de la tarea a "En Proceso".

### 2.2. Ejecución y Cierre de OT
El técnico realiza el trabajo y debe reportarlo en el sistema.

1.  Abra la OT en estado "Abierta" o "En Proceso".
2.  **Bitácora de Trabajo**: Ingrese observaciones, hallazgos y tiempos.
3.  **Consumo de Repuestos** (Crucial):
    -   En la sección "Repuestos", busque y agregue los ítems usados del inventario.
    -   El sistema **descontará automáticamente** estas cantidades del stock de Inventario.
4.  **Cierre**:
    -   Cambie el estado a **"Completada"**.
    -   Si el trabajo no se pudo terminar, márquela como "Pendiente" o "Cancelada" y agregue la justificación.

### 2.3. OT Correctivas (No Programadas)
Si se rompe algo inesperadamente:
1.  Vaya a **Órdenes de Trabajo**.
2.  Clic en **"+ Nueva OT Correctiva"**.
3.  Seleccione el Activo, describa la falla y asigne al técnico de urgencia.

### 2.4. Envío de OT por Correo Electrónico
Puede notificar formalmente a los técnicos o proveedores externos:
1.  En el listado o detalle de la OT, haga clic en el icono de **"Enviar por Correo" (Carta)**.
2.  Se abrirá un modal donde podrá:
    -   Verificar y editar el **Destinatario**.
    -   Añadir múltiples correos separados por coma (ej. `tecnico@empresa.com, supervisor@empresa.com`).
3.  El sistema adjuntará automáticamente el **PDF de la Orden de Trabajo**.
4.  Confirme el envío. El sistema le notificará si el correo fue enviado exitosamente.

---

## 3. Gestión de Técnicos

**Módulo**: Configuración > Técnicos
**Audiencia**: Jefes de Mantenimiento

Directorio del personal capacitado para realizar labores.

### 3.1. Alta de Técnicos
1.  Nombre Completo y Especialidad (Electricista, Plomero, General).
2.  Costo por Hora (Opcional, para reportes de costos).
3.  Empresa (Si es externo) o "Interno".

*Nota: Los técnicos pueden ser usuarios del sistema o simplemente nombres para asignar en las OT.*

-- Script de Reinicio de Datos (Producción)
-- ADVERTENCIA: Este script ELIMINARÁ PERMANENTEMENTE todos los datos transaccionales.
-- Se conservarán los catálogos (Categorías, Marcas, Ubicaciones, Tipos, Usuarios, Roles, Configuración).

BEGIN;

TRUNCATE TABLE 
    -- Compras y Solicitudes
    orden_compra_detalle,
    orden_compra_repuesto,
    compras_solicitud_detalle,
    compras_solicitudes,

    -- Inventario y Movimientos
    inventario_movimientos,
    historial_repuestos,
    mantenimiento_repuestos,
    activos_repuestos,

    -- Mantenimiento y Órdenes de Trabajo
    orden_trabajo,
    mantenimiento_historial,
    mantenimiento_calendario,

    -- Activos y Documentos
    activos_documentos,
    activos_equipos,

    -- Actores
    tecnicos,
    proveedores

RESTART IDENTITY CASCADE;

COMMIT;

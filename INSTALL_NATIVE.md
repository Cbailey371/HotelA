# Instalación Nativa - HotelA (Ubuntu 24.04+)

Si Docker y Portainer están dando problemas de recursos o versiones, la mejor opción es instalar el sistema directamente en Ubuntu. Esto aprovechará al máximo los 8GB de RAM de tu servidor.

## Instalación Automatizada (Recomendada)

Hemos preparado un script que hace **todo** por ti: instala Rust, Node.js, PostgreSQL, configura Nginx y crea los servicios de sistema.

### Pasos:

1.  **Sincroniza el repositorio** en tu servidor:
    ```bash
    cd /ruta/de/tus/proyectos/HotelA
    git pull origin main
    ```

2.  **Ejecuta el script de instalación**:
    ```bash
    chmod +x install_native.sh
    ./install_native.sh
    ```

### ¿Qué hará el script exactamente?
- Instalará todas las librerías necesarias para que los PDFs y el Backend funcionen.
- Creará la base de datos `hotela_management` con el usuario `hotela_user`.
- Compilará el Backend en modo optimizado.
- Compilará el Frontend.
- Creará un servicio llamado `hotela-backend` para que el servidor inicie solo al arrancar.
- Configurará **Nginx** para que la web sea accesible en el puerto 80.

---

## Comandos de Mantenimiento

### Ver el estado del Backend:
```bash
sudo systemctl status hotela-backend
```

### Ver los logs (errores) en tiempo real:
```bash
sudo journalctl -u hotela-backend -f
```

### Reiniciar el sistema:
```bash
sudo systemctl restart hotela-backend
sudo systemctl restart nginx
```

---
* CBTECH Consulting Solutions Systems © 2026 *

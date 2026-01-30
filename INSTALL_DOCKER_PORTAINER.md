# Guía de Despliegue Profesional: Docker + Portainer + GitHub
## Entorno: Ubuntu 24.04 (VM Interna - Hotel Andros)

Esta guía te permitirá instalar la aplicación y gestionarla desde un panel web (Portainer), permitiendo actualizaciones automáticas cada vez que subas cambios a GitHub.

---

### Paso 1: Instalar Docker en Ubuntu
Ejecuta estos comandos en tu terminal de la VM para instalar el motor de Docker:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg nano

# Añadir llave oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Configurar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine y Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

---

### Paso 2: Instalar Portainer (Panel Web de Gestión)
Portainer te permitirá ver y actualizar la app desde tu navegador sin usar comandos.

```bash
# Crear volumen para los datos de Portainer
sudo docker volume create portainer_data

# Instalar Portainer
sudo docker run -d -p 8000:8000 -p 9443:9443 --name portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
```

---

### Paso 3: Configuración Inicial de Portainer
1. Abre tu navegador y ve a: `https://TU_IP_VM:9443` (Acepta el certificado de seguridad).
2. Crea tu usuario **Admin** y contraseña.
3. Selecciona **"Get Started"** para conectar al entorno local de Docker.
4. **IMPORTANTE**: En la pantalla principal ("Home"), haz clic en el entorno llamado **"local"** (el recuadro con el icono de Docker). Esto activará el menú completo de gestión en la izquierda.

---

### Paso 4: Desplegar la App desde GitHub (Portainer Stack)
Una vez dentro del entorno "local", verás el menú completo:

1. En el menú de la izquierda, selecciona **Stacks** y luego haz clic en el botón **+ Add stack**.
2. Nombre: `hotela-app`.
3. Build method: **Repository**.
4. **Repository URL**: Pega la URL de tu repo de GitHub (ej: `https://github.com/tu-usuario/HotelA.git`).
6. **Repository reference**: Escribe `refs/heads/main` (esto indica que use la rama principal).
7. **Compose path**: Asegúrate de que diga `docker-compose.yml`.
8. Activa **"Automatic updates"**: Esto hará que Portainer revise GitHub cada cierto tiempo y actualice la app si hay cambios.

---

### Paso 5: Variables de Entorno (Environment Variables)
Dentro de la misma pantalla del Stack, baja hasta **Environment variables** y añade las siguientes:

| Nombre | Valor (Ejemplo) |
| :--- | :--- |
| `DB_USER` | `admin_hotel` |
| `DB_PASSWORD` | `una_clave_segura` |
| `DB_NAME` | `hotela_db` |
| `JWT_SECRET` | `genera_una_cadena_larga_aleatoria` |
| `ALLOWED_ORIGINS` | `https://tu-ip-vm,https://tu-dominio.com` |

Haz clic en **Deploy the stack**. ¡Portainer descargará todo, lo compilará y lo pondrá en marcha!

---

### Paso 6: ¿Cómo subir actualizaciones? (Tu flujo de trabajo)

Cuando el cliente te pida un cambio:
1. Haces el cambio en tu **computadora local**.
2. Pruebas que funcione y haces el `git push` a GitHub.
3. **¡Y ya está!** 
   - Si activaste "Automatic updates", Portainer detectará el cambio y actualizará la app sola.
   - Si prefieres hacerlo manual, vas a Portainer > Stacks > hotela-app > **Editor** y pulsas **"Update the stack"**.

### Ventajas de este método:
- **Cero comandos**: Una vez configurado, no vuelves a tocar la terminal negra.
- **Seguridad**: Portainer te avisa si un contenedor se detiene.
- **Logs**: Puedes ver los errores de la app directamente en la web de Portainer.
- **Base de Datos**: Puedes entrar a ver la salud de PostgreSQL desde el mismo panel.

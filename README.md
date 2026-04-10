# 🚀 Edge Core IPTV

Servidor **Edge** para arquitectura IPTV distribuida.

---

## 🧠 Descripción

El **Edge** actúa como intermediario entre el cliente y el Origin.

👉 En esta versión (v1):

* 🔁 Redirige streams desde el Origin
* ⚡ No procesa video
* 🧩 No usa MongoDB
* 🛡️ Evita doble remux (problema crítico detectado)

---

## 🏗️ Arquitectura

```text
📱 Cliente
   ↓
🌐 Edge
   ↓
🧠 Origin
   ↓
📡 Fuente IPTV
```

---

## 🎯 Objetivo de esta versión

✔ Validar arquitectura distribuida
✔ Mantener estabilidad de reproducción
✔ Evitar procesamiento innecesario
✔ Preparar base para cache inteligente

---

## 📦 Dependencias

### 🟢 Requisitos básicos

* Node.js **v18 o superior**
* npm

```bash
node -v
npm -v
```

---

### 🔗 Dependencias del proyecto

Instalar con:

```bash
npm install
```

O manual:

```bash
npm install express cors dotenv axios
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
```

---

### 🎬 FFmpeg (opcional en v1)

⚠️ En esta versión NO se usa activamente, pero se deja preparado.

#### Windows

```powershell
winget install --id Gyan.FFmpeg -e
```

#### Linux

```bash
sudo apt install ffmpeg -y
```

---

## ⚙️ Configuración

### 🔐 `.env`

```env
PORT=5001

NODE_KEY=edge-ancasti
NODE_TYPE=edge
NODE_NAME=Edge Ancasti

PUBLIC_BASE_URL=http://192.168.10.27:5001

# 🔥 IMPORTANTE
ORIGIN_BASE_URL=http://127.0.0.1:4001

HLS_ROOT=./storage/hls
FFMPEG_PATH=ffmpeg
CHANNEL_IDLE_TIMEOUT_MS=0
```

---

### 📄 `.env.example`

```env
PORT=5001

NODE_KEY=edge-example
NODE_TYPE=edge
NODE_NAME=Edge Example

PUBLIC_BASE_URL=http://IP-DEL-EDGE:5001
ORIGIN_BASE_URL=http://IP-DEL-ORIGIN:4001

HLS_ROOT=./storage/hls
FFMPEG_PATH=ffmpeg
CHANNEL_IDLE_TIMEOUT_MS=0
```

---

## 📁 Estructura del proyecto

```text
edge-core-iptv/
├─ src/
│  ├─ config/
│  ├─ controllers/
│  ├─ routes/
│  ├─ lib/
│  └─ index.ts
├─ storage/
│  └─ hls/
├─ .env
├─ .env.example
├─ .gitignore
├─ package.json
└─ tsconfig.json
```

---

## 🚀 Ejecución

### 🧪 Desarrollo

```bash
npm run dev
```

### 🏭 Producción

```bash
npm run build
npm start
```

---

## 📡 Endpoints

### ❤️ Health

```http
GET /health
```

---

### ▶️ Stream

```http
GET /stream/:channelId
```

Ejemplo:

```http
/stream/69d1063821d24bf44cb9b8a3
```

---

## 🔁 Flujo de streaming

1. Cliente pide canal al Edge
2. Edge consulta al Origin
3. Origin devuelve redirect HLS
4. Edge reenvía ese redirect
5. Cliente reproduce

---

## ⚠️ Importante

### 🖥️ Origin y Edge en la misma PC

Usar SIEMPRE:

```env
ORIGIN_BASE_URL=http://127.0.0.1:4001
```

---

## 🧪 Prueba completa

### 1. Levantar Origin

```bash
cd origin-core-iptv
npm run dev
```

### 2. Levantar Edge

```bash
cd edge-core-iptv
npm run dev
```

### 3. Probar

```txt
http://127.0.0.1:5001/stream/ID
```

---

## 📊 Estado actual

✔ Edge funcional
✔ Comunicación con Origin
✔ Redirect estable
✔ Sin congelamientos
✔ Arquitectura validada

---

## 🚧 Próximos pasos

### 🔥 Edge v1.5

* proxy real de `.m3u8`
* proxy de segmentos `.ts`

### 🔥 Edge v2

* cache local inteligente
* reuse de streams
* panel técnico
* métricas
* viewers

---

## 👨‍💻 Autor

**Diego** 🚀
Sistema IPTV distribuido de alto rendimiento

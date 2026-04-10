import { Request, Response } from "express";

export function panelController(_req: Request, res: Response) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Edge Panel</title>

<style>
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #f5f5f5;
    color: #222;
  }

  .container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    font-size: 22px;
    font-weight: bold;
  }

  .subtitle {
    font-size: 13px;
    color: #666;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .stat {
    font-size: 26px;
    font-weight: bold;
  }

  .small {
    font-size: 12px;
    color: #777;
  }

  button {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #f0f0f0;
    color: #333;
    cursor: pointer;
  }

  button:hover {
    background: #e0e0e0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  th {
    text-align: left;
    font-size: 12px;
    color: #666;
    border-bottom: 1px solid #ddd;
    padding: 8px;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #eee;
    font-size: 13px;
  }

  .mono {
    font-family: monospace;
    font-size: 11px;
    color: #444;
  }
</style>
</head>

<body>
<div class="container">

  <div class="card">
    <div class="header">
      <div>
        <div class="title">Edge Panel</div>
        <div class="subtitle">Estado técnico y métricas del Edge</div>
      </div>
      <button onclick="loadData()">Actualizar</button>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="subtitle">Nodo</div>
      <div id="nodeName"></div>
      <div id="nodeMeta" class="small"></div>
    </div>

    <div class="card">
      <div class="subtitle">Origin</div>
      <div id="originUrl"></div>
      <div class="small">Upstream actual</div>
    </div>

    <div class="card">
      <div class="subtitle">Estado</div>
      <div id="healthStatus"></div>
      <div id="healthTime" class="small"></div>
    </div>

    <div class="card">
      <div class="subtitle">Requests totales</div>
      <div id="totalRequests" class="stat">0</div>
      <div id="uptime" class="small"></div>
    </div>

    <div class="card">
      <div class="subtitle">Playlists</div>
      <div id="playlistRequests" class="stat">0</div>
      <div class="small">Pedidos .m3u8</div>
    </div>

    <div class="card">
      <div class="subtitle">Segmentos</div>
      <div id="segmentRequests" class="stat">0</div>
      <div class="small">Pedidos multimedia</div>
    </div>

    <div class="card">
      <div class="subtitle">Cache playlist</div>
      <div id="playlistCacheStats" class="stat">0 / 0</div>
      <div class="small">Hits / Misses</div>
    </div>
  </div>

  <div class="card">
    <div class="title">Canales más solicitados</div>
    <table>
      <thead>
        <tr>
          <th>Canal</th>
          <th>Stream</th>
          <th>Playlist</th>
          <th>Segmentos</th>
          <th>Total</th>
          <th>Idle</th>
          <th>Última actividad</th>
        </tr>
      </thead>
      <tbody id="channelsTable"></tbody>
    </table>
  </div>

  <div class="card">
    <div class="title">Última actividad</div>
    <table>
      <thead>
        <tr>
          <th>Canal</th>
          <th>Tipo</th>
          <th>Momento</th>
        </tr>
      </thead>
      <tbody id="recentTable"></tbody>
    </table>
  </div>

</div>

<script>
async function loadData() {
  const [health, metrics] = await Promise.all([
    fetch("/health").then(r => r.json()),
    fetch("/metrics").then(r => r.json())
  ]);

  document.getElementById("nodeName").innerText = health.nodeName;
  document.getElementById("nodeMeta").innerText = health.nodeKey + " · " + health.type;
  document.getElementById("originUrl").innerText = health.originBaseUrl || "-";
  document.getElementById("healthStatus").innerText = health.ok ? "ONLINE" : "ERROR";
  document.getElementById("healthTime").innerText = new Date().toLocaleString();

  document.getElementById("totalRequests").innerText = metrics.metrics.totalRequests;
  document.getElementById("playlistRequests").innerText = metrics.metrics.totalPlaylistRequests;
  document.getElementById("segmentRequests").innerText = metrics.metrics.totalSegmentRequests;
  document.getElementById("playlistCacheStats").innerText =
    metrics.metrics.playlistCacheHits + " / " + metrics.metrics.playlistCacheMisses;
  document.getElementById("uptime").innerText = "Uptime: " + metrics.metrics.uptimeSeconds + "s";

  const channelsTable = document.getElementById("channelsTable");
  channelsTable.innerHTML = metrics.metrics.channels.map(c => \`
    <tr>
      <td class="mono">\${c.channelId}</td>
      <td>\${c.streamRequests}</td>
      <td>\${c.playlistRequests}</td>
      <td>\${c.segmentRequests}</td>
      <td>\${c.totalRequests}</td>
      <td>\${c.idleSeconds}s</td>
      <td>\${c.lastActivityAt}</td>
    </tr>
  \`).join("");

  const recentTable = document.getElementById("recentTable");
  recentTable.innerHTML = metrics.metrics.recentChannels.map(c => \`
    <tr>
      <td class="mono">\${c.channelId}</td>
      <td>\${c.type}</td>
      <td>\${c.at}</td>
    </tr>
  \`).join("");
}

setInterval(loadData, 5000);
loadData();
</script>
</body>
</html>`);
}
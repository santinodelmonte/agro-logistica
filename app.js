let map;
let currentMarker = null;
let nearbyMarkers = [];

const clientes = [
  {
    id: 1,
    nombreCompleto: "Juan Pérez",
    ubicacion: { lat: -34.3745, lng: -57.2502 },
    observaciones: "Portón verde, llamar antes"
  },
  {
    id: 2,
    nombreCompleto: "María González",
    ubicacion: { lat: -34.3801, lng: -57.2389 },
    observaciones: "Descargar en galpón del fondo"
  },
  {
    id: 3,
    nombreCompleto: "Carlos Rodríguez",
    ubicacion: { lat: -34.3692, lng: -57.2604 },
    observaciones: "Camino de balastro"
  },
  {
    id: 4,
    nombreCompleto: "Estancia La Esperanza",
    ubicacion: { lat: -34.3621, lng: -57.2453 },
    observaciones: "Entrada por camino lateral"
  }
];

initMap();
renderClients(clientes);

function initMap() {
  map = L.map("map").setView([-34.3745, -57.2502], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function renderClients(lista) {
  const container = document.getElementById("clientList");
  container.innerHTML = "";

  lista.forEach(cliente => {
    const card = document.createElement("div");
    card.className = "client-card";

    card.innerHTML = `
      <h6>${cliente.nombreCompleto}</h6>
      <p>${cliente.observaciones}</p>

      <button class="btn btn-success btn-sm mb-1" onclick="showLocation(${cliente.id})">
        Mostrar ubicación
      </button>

      <button class="btn btn-outline-secondary btn-sm mb-1" onclick="openGoogleMaps(${cliente.ubicacion.lat}, ${cliente.ubicacion.lng})">
        Abrir en Google Maps
      </button>

      <button class="btn btn-outline-primary btn-sm" onclick="mostrarClientesCercanos(${cliente.id})">
        Clientes cercanos (10 km)
      </button>
    `;

    container.appendChild(card);
  });
}

function showLocation(id) {
  const cliente = clientes.find(c => c.id === id);

  clearNearbyMarkers();

  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  currentMarker = L.marker([cliente.ubicacion.lat, cliente.ubicacion.lng])
    .addTo(map)
    .bindPopup(`<strong>${cliente.nombreCompleto}</strong><br>${cliente.observaciones}`)
    .openPopup();

  map.setView([cliente.ubicacion.lat, cliente.ubicacion.lng], 15);
}

function mostrarClientesCercanos(idCliente) {
  const clienteBase = clientes.find(c => c.id === idCliente);
  const radioKm = 10;

  clearNearbyMarkers();

  const cercanos = clientes
    .filter(c => c.id !== idCliente)
    .map(c => {
      const distancia = calcularDistanciaKm(
        clienteBase.ubicacion.lat,
        clienteBase.ubicacion.lng,
        c.ubicacion.lat,
        c.ubicacion.lng
      );
      return { ...c, distancia };
    })
    .filter(c => c.distancia <= radioKm)
    .sort((a, b) => a.distancia - b.distancia);

  const modalTitle = document.getElementById("nearbyModalTitle");
  const modalBody = document.getElementById("nearbyModalBody");

  modalTitle.innerHTML = `Clientes cercanos a ${clienteBase.nombreCompleto}`;
  modalBody.innerHTML = "";

  if (cercanos.length === 0) {
    modalBody.innerHTML = "<p>No hay clientes cercanos en un radio de 10 km.</p>";
  }

  cercanos.forEach(cliente => {
    modalBody.innerHTML += `
      <div class="client-card">
        <h6>${cliente.nombreCompleto}</h6>
        <p>${cliente.observaciones}</p>
        <p><strong>Distancia:</strong> ${cliente.distancia.toFixed(2)} km</p>

        <button class="btn btn-success btn-sm mb-1" onclick="showLocation(${cliente.id})">
          Mostrar ubicación
        </button>

        <button class="btn btn-outline-secondary btn-sm" onclick="openGoogleMaps(${cliente.ubicacion.lat}, ${cliente.ubicacion.lng})">
          Abrir en Google Maps
        </button>
      </div>
    `;

    const marker = L.marker([cliente.ubicacion.lat, cliente.ubicacion.lng])
      .addTo(map)
      .bindPopup(`${cliente.nombreCompleto} (${cliente.distancia.toFixed(2)} km)`);

    nearbyMarkers.push(marker);
  });

  showLocation(idCliente);

  const modal = new bootstrap.Modal(document.getElementById("nearbyModal"));
  modal.show();
}

function openGoogleMaps(lat, lng) {
  if (!navigator.geolocation) {
    alert("La geolocalización no está disponible");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const originLat = position.coords.latitude;
    const originLng = position.coords.longitude;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  });
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clearNearbyMarkers() {
  nearbyMarkers.forEach(marker => map.removeLayer(marker));
  nearbyMarkers = [];
}

document.getElementById("searchInput").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  const filtered = clientes.filter(c =>
    c.nombreCompleto.toLowerCase().includes(value)
  );
  renderClients(filtered);
});
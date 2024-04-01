const locations = JSON.parse(document.getElementById('map').dataset.locations);

const map = L.map('map', {
  scrollWheelZoom: false,
});

// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const greenIcon = L.icon({
  iconUrl: './../img/pin.png', // Replace with your green marker icon URL
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const markerLocations = [];

locations.forEach((location) => {
  const [lng, lat] = location.coordinates; // this distructures the locations coordinates
  const leafletLatLng = [lat, lng]; // this arranges it to be lat before lng because mongodb stores in lnglat but leaflet uses latlng
  markerLocations.push(leafletLatLng); // Add each location to the array

  const marker = L.marker(leafletLatLng, { icon: greenIcon }).addTo(map);

  marker.bindPopup(`<h2>${location.description}</h2>`).openPopup();
});

// Fit the map bounds to contain all the markers
if (markerLocations.length > 0) {
  let bounds = L.latLngBounds(markerLocations);
  map.fitBounds(bounds);
}

console.log("event.js VERSION TUILES LOCALES – 2026-02-05");


// ====== POLLUEURS : chargement via tuiles locales (GitHub Pages) ======

// IMPORTANT : adapte si ton repo/pages n'est pas "bassintopage"
const POLLUEURS_TILES_BASE = "/bassintopage/data/pollueurs_tiles";

// bbox attendue : [minLon, minLat, maxLon, maxLat]
function tilesForBBox_1deg(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;

  // On prend floor() des bornes pour récupérer toutes les tuiles intersectées
  const lonStart = Math.floor(minLon);
  const lonEnd   = Math.floor(maxLon);
  const latStart = Math.floor(minLat);
  const latEnd   = Math.floor(maxLat);

  const tiles = [];
  for (let lon = lonStart; lon <= lonEnd; lon++) {
    for (let lat = latStart; lat <= latEnd; lat++) {
      tiles.push({ lon, lat });
    }
  }
  return tiles;
}

async function fetchPollueursFromLocalTiles(bbox) {
  const tiles = tilesForBBox_1deg(bbox);

  const urls = tiles.map(t => `${POLLUEURS_TILES_BASE}/tile_${t.lon}_${t.lat}.geojson`);

  // On tente de charger chaque tuile ; si 404 -> on ignore
  const parts = await Promise.all(
    urls.map(u =>
      fetch(u)
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );

  // Merge des features
  let features = parts
    .filter(p => p && Array.isArray(p.features))
    .flatMap(p => p.features);

  // Filtre fin : on ne garde que les points strictement dans la bbox (au cas où)
  const [minLon, minLat, maxLon, maxLat] = bbox;
  features = features.filter(f => {
    if (!f || !f.geometry) return false;
    if (f.geometry.type !== "Point") return true; // si jamais (prudence)
    const [lon, lat] = f.geometry.coordinates || [];
    if (typeof lon !== "number" || typeof lat !== "number") return false;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  });

  return { type: "FeatureCollection", features };
}

// Écouteur pour les établissements pollueurs (version tuiles locales)
document.getElementById("pollueurs-checkbox").addEventListener("change", async function (event) {
  // si décoché : nettoyage et on sort
  if (!event.target.checked) {
    pollutionLayer.clearLayers();
    return;
  }

  try {
    console.log("bbox (pollueurs) :", bbox);

    // 1) Charger les pollueurs depuis les tuiles locales
    const data = await fetchPollueursFromLocalTiles(bbox);

    jsonData = data;
    console.log("Pollueurs (local tiles) features:", data.features.length);

    // 2) Reprendre ta logique existante
    const markerspoll = parseWFSData(data);
    lastpollpoints = markerspoll;

    // 3) Afficher
    pollutionLayer.clearLayers();
    markerspoll.forEach(marker => marker.addTo(pollutionLayer));

  } catch (error) {
    console.error("Error fetching pollueurs from local tiles:", error);
  }
});


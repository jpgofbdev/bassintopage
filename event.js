/* ============================================================
   event.js — refactor complet (bassintopage)
   Objectifs :
   - garder ta logique Leaflet existante (mêmes checkbox / mêmes couches)
   - supprimer le CORS Georisques pour "pollueurs" :
       => chargement via tuiles locales générées par GitHub Actions
          /bassintopage/data/pollueurs_tiles/tile_{lon}_{lat}.geojson
   ============================================================ */

/* =========================
   Helpers
   ========================= */

function $(id) {
  return document.getElementById(id);
}

function safeOnChange(id, handler) {
  const el = $(id);
  if (!el) {
    console.warn(`[event.js] Élément #${id} introuvable (listener non attaché).`);
    return;
  }
  el.addEventListener("change", handler);
}

function fetchJson(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
    return r.json();
  });
}

function fetchText(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
    return r.text();
  });
}

// Normalise une bbox vers [minLon, minLat, maxLon, maxLat]
function normalizeBBoxLonLat(bboxRaw) {
  const a0 = bboxRaw?.[0], a1 = bboxRaw?.[1], a2 = bboxRaw?.[2], a3 = bboxRaw?.[3];

  const looksLikeLon = (x) => typeof x === "number" && x >= -20 && x <= 30;
  const looksLikeLat = (x) => typeof x === "number" && x >= 35 && x <= 60;

  // [minLon, minLat, maxLon, maxLat]
  if (looksLikeLon(a0) && looksLikeLat(a1) && looksLikeLon(a2) && looksLikeLat(a3)) {
    return [a0, a1, a2, a3];
  }
  // [minLat, minLon, maxLat, maxLon] -> convert
  if (looksLikeLat(a0) && looksLikeLon(a1) && looksLikeLat(a2) && looksLikeLon(a3)) {
    return [a1, a0, a3, a2];
  }
  // fallback
  return [a0, a1, a2, a3];
}

// Chaîne BBOX au format historique de ton code : "minLat,minLon,maxLat,maxLon,SRS"
function bboxToWfsBBOXParam_LatLon(bboxRaw, srs = "urn:ogc:def:crs:EPSG::4326") {
  const [minLon, minLat, maxLon, maxLat] = normalizeBBoxLonLat(bboxRaw);
  return `${minLat},${minLon},${maxLat},${maxLon},${srs}`;
}

/* =========================
   Leaflet Icons
   ========================= */

function makeColoredIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

var orangeIcon = makeColoredIcon("orange");
var redIcon = makeColoredIcon("red");
var blackIcon = makeColoredIcon("black");

// STEP markers
var markersstep = [];

/* ============================================================
   1) STEP (SANDRE ODP) — sa:SysTraitementEauxUsees (GML)
   ============================================================ */

safeOnChange("step-checkbox", function (event) {
  const baseURL2 = "https://services.sandre.eaufrance.fr/geo/odp";

  const urlbb2 =
    `${baseURL2}?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0` +
    `&TYPENAMES=sa:SysTraitementEauxUsees&COUNT=80000&SRSNAME=urn:ogc:def:crs:EPSG::4326` +
    `&BBOX=${bboxToWfsBBOXParam_LatLon(bbox)}`;

  console.log("[STEP] URL:", urlbb2);

  // Si décoché : nettoyage simple (si tu utilises une layerGroup ailleurs, adapte)
  if (!event.target.checked) {
    markersstep.forEach((m) => {
      try { map.removeLayer(m); } catch (e) {}
    });
    markersstep = [];
    return;
  }

  fetchText(urlbb2)
    .then((data) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");
      const features = xmlDoc.getElementsByTagName("sa:SysTraitementEauxUsees");

      markersstep = [];

      Array.from(features).forEach((feature) => {
        const coordElement = feature.getElementsByTagName("gml:pos")[0];
        if (!coordElement) return;

        const coords = coordElement.textContent.trim().split(/\s+/).map(Number);
        if (coords.length !== 2) return;

        const lat = coords[0];
        const lon = coords[1];

        // popup simple
        const nom = feature.getElementsByTagName("sa:NomInstallation")[0]?.textContent || "STEP";
        const marker = L.marker([lat, lon], { icon: orangeIcon }).bindPopup(nom);
        markersstep.push(marker);
      });

      markersstep.forEach((m) => m.addTo(map));
      console.log("[STEP] markers:", markersstep.length);
    })
    .catch((error) => console.error("[STEP] Error:", error));
});

/* ============================================================
   2) BBOX BV ORANGE — code historique conservé
   ============================================================ */

safeOnChange("bboxbvorange-checkbox", function () {
  console.log("Checkbox changed, checked:", this.checked);

  if (this.checked) {
    if (typeof intersectedPolygon !== "undefined" && intersectedPolygon) {
      console.log("BBOX (checkbox change):", bbox);

      if (bbox) {
        var bboxPolygon = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [bbox[0], bbox[1]],
              [bbox[2], bbox[1]],
              [bbox[2], bbox[3]],
              [bbox[0], bbox[3]],
              [bbox[0], bbox[1]],
            ]],
          },
        };

        L.geoJSON(bboxPolygon, {
          style: {
            color: "orange",
            fillColor: "orange",
            fillOpacity: 0.5,
          },
        }).addTo(map);
      }
    } else {
      console.log("No bbox to display, intersectedPolygon is null/undefined.");
    }
  } else {
    map.eachLayer(function (layer) {
      if (layer.feature && layer.feature.geometry && layer.feature.geometry.type === "Polygon") {
        map.removeLayer(layer);
      }
    });
    console.log("BBOX removed from the map.");
  }
});

/* ============================================================
   3) POLLUEURS — tuiles locales (FIN du CORS)
   ============================================================ */

const POLLUEURS_TILES_BASE = "/bassintopage/data/pollueurs_tiles";

function tilesForBBox_1deg(bboxRaw) {
  const [minLon, minLat, maxLon, maxLat] = normalizeBBoxLonLat(bboxRaw);

  const lonStart = Math.floor(minLon);
  const lonEnd = Math.floor(maxLon);
  const latStart = Math.floor(minLat);
  const latEnd = Math.floor(maxLat);

  const tiles = [];
  for (let lon = lonStart; lon <= lonEnd; lon++) {
    for (let lat = latStart; lat <= latEnd; lat++) {
      tiles.push({ lon, lat });
    }
  }
  return tiles;
}

async function fetchPollueursFromLocalTiles(bboxRaw) {
  const bboxLonLat = normalizeBBoxLonLat(bboxRaw);
  const tiles = tilesForBBox_1deg(bboxLonLat);
  const urls = tiles.map((t) => `${POLLUEURS_TILES_BASE}/tile_${t.lon}_${t.lat}.geojson`);

  const parts = await Promise.all(
    urls.map((u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  );

  let features = parts
    .filter((p) => p && Array.isArray(p.features))
    .flatMap((p) => p.features);

  // filtre fin bbox (utile car tu charge une tuile 1°x1°)
  const [minLon, minLat, maxLon, maxLat] = bboxLonLat;
  features = features.filter((f) => {
    if (!f || !f.geometry) return false;
    if (f.geometry.type !== "Point") return true;
    const [lon, lat] = f.geometry.coordinates || [];
    return (
      typeof lon === "number" &&
      typeof lat === "number" &&
      lon >= minLon &&
      lon <= maxLon &&
      lat >= minLat &&
      lat <= maxLat
    );
  });

  return { type: "FeatureCollection", features };
}

safeOnChange("pollueurs-checkbox", async function (event) {
  if (!event.target.checked) {
    if (typeof pollutionLayer !== "undefined" && pollutionLayer?.clearLayers) {
      pollutionLayer.clearLayers();
    }
    return;
  }

  try {
    console.log("[POLLUEURS] bbox brute:", bbox);
    const data = await fetchPollueursFromLocalTiles(bbox);
    console.log("[POLLUEURS] features:", data.features.length);

    var markerspoll = parseWFSData(data);
    lastpollpoints = markerspoll;

    if (typeof pollutionLayer !== "undefined" && pollutionLayer?.clearLayers) {
      pollutionLayer.clearLayers();
      markerspoll.forEach((marker) => marker.addTo(pollutionLayer));
    } else {
      markerspoll.forEach((marker) => marker.addTo(map));
    }
  } catch (error) {
    console.error("Error fetching pollueurs from local tiles:", error);
  }
});

/* ============================================================
   4) ICPE — API georisques (JSON)
   ============================================================ */

safeOnChange("icpe-checkbox", function (event) {
  if (!event.target.checked) {
    if (typeof icpeLayer !== "undefined" && icpeLayer?.clearLayers) icpeLayer.clearLayers();
    return;
  }

  if (typeof latlng === "undefined") {
    console.error("[ICPE] latlng est undefined (clic sur la carte manquant ?)");
    return;
  }

  console.log([latlng.lng, latlng.lat]);

  const baseURL = "https://georisques.gouv.fr/api/v1/installations_classees";
  const urlicpe = `${baseURL}?latlon=${encodeURIComponent(`${latlng.lng},${latlng.lat}`)}&rayon=10000`;
  console.log("[ICPE] URL:", urlicpe);

  fetchJson(urlicpe)
    .then((data) => {
      const markers = parseInstallationsData(data);
      console.log("[ICPE] markers créés:", markers.length);

      // Assure que la couche est visible si elle existe
      if (typeof icpeLayer !== "undefined" && icpeLayer) {
        if (!map.hasLayer(icpeLayer)) {
          icpeLayer.addTo(map);
        }
        icpeLayer.clearLayers();
        markers.forEach(m => m.addTo(icpeLayer));
      } else {
        // fallback : ajout direct à la carte
        markers.forEach(m => m.addTo(map));
      }

      // Debug rapide : zoom sur les points si au moins 1 marker
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    })
    .catch((error) => console.error("[ICPE] Error:", error));
});


/* ============================================================
   5) AAC / PPR — fichiers locaux (CVL)
   ============================================================ */

let aacLayer = null;
let pprLayer = null;

safeOnChange("AAC-checkbox", function (event) {
  if (event.target.checked) {
    fetchJson("./AAC_CVL.geojson")
      .then((data) => {
        aacLayer = L.geoJSON(data, {
          style: { color: "#1f78b4", weight: 2, fillOpacity: 0.3 },
          onEachFeature: function (feature, layer) {
            const props = feature.properties;
            if (props?.NomDeAAC_A) layer.bindPopup(props.NomDeAAC_A);
          },
        }).addTo(map);
      })
      .catch((err) => console.error("Erreur chargement AAC_CVL.geojson :", err));
  } else {
    if (aacLayer) map.removeLayer(aacLayer);
  }
});

safeOnChange("PPR-checkbox", function (event) {
  if (event.target.checked) {
    fetchJson("./PPR_CVL.geojson")
      .then((data) => {
        pprLayer = L.geoJSON(data, {
          style: { color: "#e31a1c", weight: 2, fillOpacity: 0.3 },
        }).addTo(map);
      })
      .catch((err) => console.error("Erreur chargement PPR_CVL.geojson :", err));
  } else {
    if (pprLayer) map.removeLayer(pprLayer);
  }
});

/* ============================================================
   6) TOPAGE cours d'eau dans la bbox — WFS Sandre (GML)
   ============================================================ */

safeOnChange("topagecebbox-checkbox", function (event) {
  if (!event.target.checked) {
    return;
  }

  const baseURL = "https://services.sandre.eaufrance.fr/geo/sandre";
  const urlbb3 =
    `${baseURL}?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0` +
    `&TYPENAMES=sa:CoursEau_FXX_Topage2024&SRSNAME=urn:ogc:def:crs:EPSG::4326` +
    `&BBOX=${bboxToWfsBBOXParam_LatLon(bbox)}`;

  console.log("[TOPAGE CE] URL:", urlbb3);

  fetchText(urlbb3)
    .then((data) => addGMLToMap(data))
    .catch((error) => console.error("[TOPAGE CE] Error:", error));
});

/* ============================================================
   Fonctions (réutilisées par tes listeners)
   ============================================================ */

// Parser générique GeoJSON points -> markers Leaflet
function parseWFSData(data) {
  var markers = [];
  var features = data.features || [];

  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    var geometry = feature.geometry;
    var properties = feature.properties || {};

    if (!geometry) continue;

    if (geometry.type === "Point") {
      var coordsep = geometry.coordinates; // [lon, lat]
      var marker = L.marker([coordsep[1], coordsep[0]], { icon: blackIcon }).bindPopup(
        Object.keys(properties).map((key) => `${key}: ${properties[key]}`).join("<br>")
      );
      markers.push(marker);
    }
  }
  return markers;
}

// Parser ICPE (API georisques)
function parseInstallationsData(data) {
  const markers = [];
  const installations = data?.data || [];

  if (!Array.isArray(installations)) {
    console.warn("[ICPE] data.data n'est pas un tableau :", data);
    return markers;
  }

  installations.forEach((installation) => {
    const lat = Number(installation.latitude);
    const lon = Number(installation.longitude);

    // garde-fou : si coordonnées absentes, on saute
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const popupContent = `
      <strong>Raison Sociale:</strong> ${installation.raisonSociale || 'Non disponible'}<br>
      <strong>Adresse 1:</strong> ${installation.adresse1 || 'Non disponible'}<br>
      <strong>Adresse 2:</strong> ${installation.adresse2 || 'Non disponible'}<br>
      <strong>Code Postal:</strong> ${installation.codePostal || 'Non disponible'}<br>
      <strong>Commune:</strong> ${installation.commune || 'Non disponible'}<br>
      <strong>Code Insee:</strong> ${installation.codeInsee || 'Non disponible'}<br>
      <strong>Code NAF:</strong> ${installation.codeNaf || 'Non disponible'}<br>
      <strong>SIRET:</strong> ${installation.siret || 'Non disponible'}<br>
      <strong>Priorité Nationale:</strong> ${installation.prioriteNationale ? 'Oui' : 'Non'}<br>
      <strong>Régime:</strong> ${installation.regime || 'Non disponible'}<br>
      <strong>Service AIOT:</strong> ${installation.serviceAIOT || 'Non disponible'}<br>
      <strong>Inspections:</strong> ${
        Array.isArray(installation.inspections) && installation.inspections.length > 0
          ? installation.inspections.map(i => `Date: ${i.dateInspection}`).join(', ')
          : 'Aucune'
      }<br>
      <strong>Date de mise à jour:</strong> ${installation.date_maj || 'Non disponible'}<br>
    `;

    // Leaflet attend [lat, lon]
    const marker = L.marker([lat, lon], { icon: redIcon }).bindPopup(popupContent);
    markers.push(marker);
  });

  return markers;
}


// Ajout simple de GML lignes (LineString) à la carte (cours d'eau, etc.)
function addGMLToMap(gmlText) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gmlText, "text/xml");

    const lineStrings = xmlDoc.getElementsByTagName("gml:LineString");
    console.log("[GML] LineStrings:", lineStrings.length);

    for (let i = 0; i < lineStrings.length; i++) {
      const posList = lineStrings[i].getElementsByTagName("gml:posList")[0];
      if (!posList) continue;

      const coords = posList.textContent.trim().split(/\s+/).map(Number);
      const latlngs = [];
      for (let j = 0; j < coords.length; j += 2) {
        const lat = coords[j];
        const lon = coords[j + 1];
        if (!isFinite(lat) || !isFinite(lon)) continue;
        latlngs.push([lat, lon]);
      }

      if (latlngs.length > 1) {
        L.polyline(latlngs).addTo(map);
      }
    }
  } catch (e) {
    console.error("[GML] addGMLToMap error:", e);
  }
}




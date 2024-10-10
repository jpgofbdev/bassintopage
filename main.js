
proj4.defs("EPSG:2154", "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

//On définit les variables pour pouvoir les utiliser dans les fichiers fonctions
window.map = L.map("map", { zoomControl: false }).setView([46.603354, 1.888334], 7);
window.pollutionLayer = L.layerGroup().addTo(map);
window.icpeLayer = L.layerGroup().addTo(map);

window.stepLayer = L.layerGroup().addTo(map);
window.ceLayer = L.layerGroup().addTo(map);

var jsonData = null;
window.bbox = [];
var greenIcon = new L.Icon({
iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
iconSize: [25, 41],
iconAnchor: [12, 41],
popupAnchor: [1, -34],
shadowSize: [41, 41]
});


// Charger les données GeoJSON depuis le serveur
window.geojsonLayer;
fetch('./bvtopo4326_8cvl.geojson')
    .then(response => response.json())
    .then(data => {
        // Créer une couche GeoJSON sans l'ajouter à la carte
        window.geojsonLayer = L.geoJSON(data);
        //.addTo(map); // Ne pas appeler addTo(map)
    })
    .catch(error => console.error('Erreur lors du chargement du fichier GeoJSON :', error));



window.lastGeoJSON4326 = null;
var lastPollueurspoints = null;
var lastStepspoints = null;
var currentPolygon = null;
//window.currentBBox = null;
var markerbv = null;
import { sendPostRequest } from './postRequest.js';


//On définit les fonctions globales
window.convertGeoJSON=function(geojson, fromProj, toProj) {
    var newGeoJSON = JSON.parse(JSON.stringify(geojson));
    newGeoJSON.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates = feature.geometry.coordinates.map(polygon => {
                return polygon.map(ring => {
                    return ring.map(coord => {
                        var convertedCoord = proj4(fromProj, toProj, coord);
                        return [convertedCoord[0], convertedCoord[1]];
                    });
                });
            });
        }
    });
    return newGeoJSON;
}
function calculateBBoxFromGeoJSON(intersectedPolygon) {
   let bbox = [];

    if (intersectedPolygon.geometry.type === 'Polygon' || intersectedPolygon.geometry.type === 'MultiPolygon') {
        // Loop through the coordinates of each polygon
        intersectedPolygon.geometry.coordinates.forEach(polygon => {
            polygon.forEach(ring => {
                ring.forEach(coord => {
                    // Initialize bbox or update with the min/max values
                    if (bbox.length === 0) {
                        bbox = [coord[0], coord[1], coord[0], coord[1]];  // Initialize with [minX, minY, maxX, maxY]
                    } else {
                        bbox[0] = Math.min(bbox[0], coord[0]);  // minX
                        bbox[1] = Math.min(bbox[1], coord[1]);  // minY
                        bbox[2] = Math.max(bbox[2], coord[0]);  // maxX
                        bbox[3] = Math.max(bbox[3], coord[1]);  // maxY
                    }
                });
            });
        });
    }

    return bbox.length ? bbox : null;
}



function initializeMap() {
 ///////////////////
            if (typeof Gp === 'undefined') {
                console.error("Gp is not defined. Ensure the Geoportal script is loaded.");
                return;
            }
            Gp.Services.getConfig({
                apiKey: "essentiels",
                onSuccess: function(config) {
                    console.log("Configuration retrieved successfully:", config);
        
                    if (!map) {
                        console.error("Map is not defined. Ensure the map is initialized before calling 'go()'.");
                        return;
                    }
                    
                    go();
                },
                onError: function(error) {
                    console.error("Failed to retrieve configuration:", error);
                }
            });
            function go() {
                enableGeolocation(map);
                var myRenderer = L.canvas({ padding: 0.5 });

// Gestion du chargement du fichier GeoJSON quand on clique file-input

                var lyrOrtho = L.geoportalLayer.WMTS({
                    layer: "ORTHOIMAGERY.ORTHOPHOTOS"
                });

                var lyrMaps = L.geoportalLayer.WMTS({
                    layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"
                }, {
                    opacity: 0.7
                }).addTo(map);

                var lyrOSM = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                });

                var baseLayers = {
                    "OpenStreetMap": lyrOSM,
                    "Orthophotos": lyrOrtho,
                    "Plan IGN": lyrMaps
                };

                L.control.layers(baseLayers).addTo(map);
            //}
///////////////
           

               



////////////////////////////////////////////////////////////////////////

//                                                                                                //         MAP ON CLICK  //

////////
map.on('click', function(e) {
    window.latlng = e.latlng;

    var coords = [latlng.lng, latlng.lat];
    const point = turf.point([e.latlng.lng, e.latlng.lat]);

    // Vérifier l'intersection avec les polygones
    const features = geojsonLayer.toGeoJSON().features;
    window.intersectedPolygon = null;

    for (const feature of features) {
        const coordinates = feature.geometry.coordinates;

        if (feature.geometry.type === 'Polygon') {
            // Si c'est un Polygon
            const polygon = turf.polygon(coordinates);
            if (turf.booleanPointInPolygon(point, polygon)) {
                intersectedPolygon = feature;
                break;
            }
        } else if (feature.geometry.type === 'MultiPolygon') {
            // Si c'est un MultiPolygon
            const multiPolygon = turf.multiPolygon(coordinates);
            if (turf.booleanPointInPolygon(point, multiPolygon)) {
                intersectedPolygon = feature;
                break;
            }
        } else {
            console.warn('Géométrie non supportée :', feature.geometry.type);
        }

    }

    // Affichage du polygone intersecté
    if (intersectedPolygon) {
        const coordinates = intersectedPolygon.geometry.coordinates;
        L.geoJSON(intersectedPolygon, {
            style: {
                color: 'yellow',
                fillColor: 'yellow',
                fillOpacity: 0.5,
                weight: 2
            }
        }).addTo(map);

        window.bbox = calculateBBoxFromGeoJSON(intersectedPolygon);                   //calcul de la bbox
        console.log("Calculated BBOX:", bbox);





        alert('le point choisi est bien sur un bassin versant topage');
    } else {
        alert('Les point choisi n est pas sur un BV Topage');
    }









                   // sendPostRequest(coords,map);
                   //si il y avait déjà un point BV on l'enlève pour qu'il n'y en ait qu'un
                    if (markerbv) {
                        map.removeLayer(markerbv);
                    }
                    markerbv = L.marker([latlng.lat, latlng.lng], { icon: greenIcon }).addTo(map);   //on rajoute la couche recalculée à chaque fois même si et c'est improbable
                    //le clic était le même 
                }        
            );
            map.on('zoomend', function() {
                    var zoomLevel = map.getZoom();
                    document.getElementById('zoom-level').textContent = "Le niveau de zoom est de " + zoomLevel + ". Le niveau conseillé pour choisir un point est de 13 au moins.";
                });

//                                                                                                  SEND POST REQUEST FOR BV
//sendPostRequest(coords, map);

 
//                                                                   //                            //     EVENT DOWNLOAD  //
//////////////////////////////////////////////////////////////////////// 

document.getElementById('download-button').addEventListener('click', function() {
                    if (lastGeoJSON4326) {
                        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastGeoJSON4326));
                        var downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", "bassin_versant_EPSG4326.geojson");
                        document.body.appendChild(downloadAnchorNode); // Required for Firefox
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                    } else {
                        alert("Aucun GeoJSON disponible à télécharger.");
                    }
                });
////////////////////////////////////////////////////////////////////////  EVENT TOPAGE DEPT

let topage41Layer = null;

document.getElementById('checkbox-41').addEventListener('change', function(event) {
    if (event.target.checked) {
        fetch('./topage41.json')
            .then(response => response.json())
            .then(data => {
                topage41Layer = L.geoJSON(data, {
                    style: function (feature) {
                        return { color: "#8B4513" };
                    }
                }).addTo(map);
            })
            .catch(error => console.error('Erreur lors du chargement du fichier topage41.json:', error));
    } else {
        if (topage41Layer) {
            map.removeLayer(topage41Layer);
        }
    }
});




//ecouteur STEP //dans fichier event
  

/////////
            

           
			


            document.getElementById('download-json-button').addEventListener('click', function() {
                if (jsonData) {
                    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
                    var downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", "data.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                } else {
                    alert('Aucune donnée JSON disponible pour le téléchargement.');
                }
            });

            document.getElementById('download-csv-button').addEventListener('click', function() {
                if (jsonData) {
                    var csvContent = "data:text/csv;charset=utf-8,";
                    var headers = ["latitude", "longitude", ...Object.keys(jsonData.features[0].properties)];
                    csvContent += headers.join(",") + "\n";

                    jsonData.features.forEach(feature => {
                        if (feature.geometry.type === "Point") {
                            var coords = feature.geometry.coordinates;
                            var properties = Object.values(feature.properties).map(value => `"${value}"`);
                            csvContent += [coords[1], coords[0], ...properties].join(",") + "\n";
                        }
                    });

                    var encodedUri = encodeURI(csvContent);
                    var downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", encodedUri);
                    downloadAnchorNode.setAttribute("download", "data.csv");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                } else {
                    alert('Aucune donnée CSV disponible pour le téléchargement.');
                }
            });

           // fetchWFSData();

        }
    
    
    
    
    
        

    
    }
//FIN initializeMap();

      





        window.addEventListener('load', initializeMap);

        function enableGeolocation(map) {
    var geoMarker = null;  // Initialement aucun marqueur

    // Fonction pour afficher la position de l'utilisateur
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        // Si aucun marqueur n'existe, on le crée
        if (!geoMarker) {
            geoMarker = L.marker(e.latlng, {
                icon: L.icon({
                    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                })
            }).addTo(map);
        }

        // Mettre à jour la position et le contenu du popup
        geoMarker.setLatLng(e.latlng)
            .setPopupContent("Vous êtes ici. Précision: " + Math.round(radius) + " mètres.")
            .openPopup();

        // Centrer la carte sur la position de l'utilisateur
        map.setView(e.latlng, 13);
    }

    // Fonction appelée lorsque la géolocalisation échoue
    function onLocationError(e) {
        switch (e.code) {
            case 1:
                alert("L'utilisateur a refusé la demande de géolocalisation.");
                break;
            case 2:
                alert("La position est indisponible.");
                break;
            case 3:
                alert("Le délai d'attente pour obtenir la localisation a expiré.");
                break;
            default:
                alert("Une erreur inconnue s'est produite.");
        }
    }

    // Options de géolocalisation
    var geoOptions = {
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true, // Essayer d'obtenir la meilleure précision
        timeout: 10000, // Temps maximum avant d'abandonner (10s)
        maximumAge: 0 // Ne pas utiliser une position en cache
    };

    // Activer la géolocalisation
    map.locate(geoOptions);

    // Écouter les événements de géolocalisation
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
}
       // var myRenderer = L.canvas({ padding: 0.5 });

// Gestion du chargement du fichier GeoJSON


    // Fonction pour créer le contenu du popup
    function createPopupContent(properties) {
        var content = '<b>Propriétés de l\'objet :</b><br>';
        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                content += '<b>' + key + ':</b> ' + properties[key] + '<br>';
            }
        }
        return content;
    }










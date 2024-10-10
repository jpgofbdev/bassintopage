var markersstep = []; // Tableau pour stocker les marqueurs
var orangeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
    });

    var redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
        });

        var blackIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
            });
        


document.getElementById('step-checkbox').addEventListener('change', function(event) {

    const baseURL2 = 'https://services.sandre.eaufrance.fr/geo/odp';

    // Construction de l'URL
    const urlbb2 = `${baseURL2}?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0`
        + `&TYPENAMES=sa:SysTraitementEauxUsees&COUNT=80000&SRSNAME=urn:ogc:def:crs:EPSG::4326`
        + `&BBOX=${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},urn:ogc:def:crs:EPSG::4326`;

    console.log('URL générée2:', urlbb2);


    // Fetch des données
    fetch(urlbb2)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la requête réseau : ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            // Parser le XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");
            const features = xmlDoc.getElementsByTagName('sa:SysTraitementEauxUsees');

            // Réinitialiser le tableau de marqueurs
            markersstep = [];

            // Extraire les données et créer des marqueurs
            Array.from(features).forEach(feature => {
                const lat = parseFloat(feature.getElementsByTagName('sa:LatWGS84OuvrageDepollution')[0]?.textContent);
                const lon = parseFloat(feature.getElementsByTagName('sa:LongWGS84OuvrageDepollution')[0]?.textContent);
    const nom = feature.getElementsByTagName('sa:NomOuvrageDepollution')[0]?.textContent || 'Nom non disponible';
    const type = feature.getElementsByTagName('sa:MnNatureSystTraitementEauxUsees')[0]?.textContent || 'Type non disponible';
    const capacite = feature.getElementsByTagName('sa:CapaciteNom')[0]?.textContent || 'Capacité non disponible';
    const commune = feature.getElementsByTagName('sa:LbCommune')[0]?.textContent || 'Commune non disponible';
    const dateMiseService = feature.getElementsByTagName('sa:DateMiseServiceOuvrageDepollution')[0]?.getElementsByTagName('gml:timePosition')[0]?.textContent || 'Date non disponible';
    const cdOuvrage = feature.getElementsByTagName('sa:CdOuvrageDepollution')[0]?.textContent || 'Code non disponible';
    const lbTypeOuvrage = feature.getElementsByTagName('sa:LbTypeOuvrageDepollution')[0]?.textContent || 'Libellé Type Ouvrage non disponible';
    const lbNatureSyst = feature.getElementsByTagName('sa:LbNatureSystTraitementEauxUsees')[0]?.textContent || 'Libellé Nature Système non disponible';
    const lbExistAutosurv = feature.getElementsByTagName('sa:LbExistAutosurv')[0]?.textContent || 'Existence Autosurveillance non disponible';
    const lbConformiteAutosurv = feature.getElementsByTagName('sa:LbConformiteAutosurveillance')[0]?.textContent || 'Conformité Autosurveillance non disponible';
    const dateMAJSTEU = feature.getElementsByTagName('sa:DateMAJSTEU')[0]?.getElementsByTagName('gml:timePosition')[0]?.textContent || 'Date MAJ non disponible';
    const lbSystemeCollecte = feature.getElementsByTagName('sa:LbSystemeCollecte')[0]?.textContent || 'Système Collecte non disponible';
    const nomAgglomeration = feature.getElementsByTagName('sa:NomAgglomerationAssainissement')[0]?.textContent || 'Agglomération non disponible';
    const cdCommune = feature.getElementsByTagName('sa:CdCommune')[0]?.textContent || 'Code Commune non disponible';
    const nomZS = feature.getElementsByTagName('sa:NomZS')[0]?.textContent || 'Zone Sensible non disponible';
    const nomCircAdminBassin = feature.getElementsByTagName('sa:NomCircAdminBassin')[0]?.textContent || 'Circonscription Administratif non disponible';
    const lbOuvrageRejet = feature.getElementsByTagName('sa:LbOuvrageRejet')[0]?.textContent || 'Ouvrage Rejet non disponible';
    const cdEuMasseDEau = feature.getElementsByTagName('sa:CdEuMasseDEau')[0]?.textContent || 'Code EU Masse d\'Eau non disponible';
    const latOuvrageRejet = feature.getElementsByTagName('sa:LatWGS84OuvrageRejet')[0]?.textContent || 'Latitude Ouvrage Rejet non disponible';
    const lonOuvrageRejet = feature.getElementsByTagName('sa:LonWGS84OuvrageRejet')[0]?.textContent || 'Longitude Ouvrage Rejet non disponible';
    const nomMasseDEau = feature.getElementsByTagName('sa:NomMasseDEau')[0]?.textContent || 'Nom Masse d\'Eau non disponible';

    const info = `
        <strong>Nom :</strong> ${nom}<br>
        <strong>Type :</strong> ${type}<br>
        <strong>Capacité :</strong> ${capacite}<br>
        <strong>Commune :</strong> ${commune}<br>
        <strong>Date de mise en service :</strong> ${dateMiseService}<br>
        <strong>Code Ouvrage :</strong> ${cdOuvrage}<br>
        <strong>Libellé Type Ouvrage :</strong> ${lbTypeOuvrage}<br>
        <strong>Libellé Nature Système :</strong> ${lbNatureSyst}<br>
        <strong>Existence Autosurveillance :</strong> ${lbExistAutosurv}<br>
        <strong>Conformité Autosurveillance :</strong> ${lbConformiteAutosurv}<br>
        <strong>Date MAJ :</strong> ${dateMAJSTEU}<br>
        <strong>Système Collecte :</strong> ${lbSystemeCollecte}<br>
        <strong>Agglomération :</strong> ${nomAgglomeration}<br>
        <strong>Code Commune :</strong> ${cdCommune}<br>
        <strong>Nom Zone Sensible :</strong> ${nomZS}<br>
        <strong>Circonscription Administratif :</strong> ${nomCircAdminBassin}<br>
        <strong>Ouvrage Rejet :</strong> ${lbOuvrageRejet}<br>
        <strong>Code EU Masse d'Eau :</strong> ${cdEuMasseDEau}<br>
        <strong>Latitude Ouvrage Rejet :</strong> ${latOuvrageRejet}<br>
        <strong>Longitude Ouvrage Rejet :</strong> ${lonOuvrageRejet}<br>
        <strong>Nom Masse d'Eau :</strong> ${nomMasseDEau}
    `;                
                if (lat && lon) {
                    const marker = L.marker([lat, lon], { icon: orangeIcon  });
                    marker.bindPopup(info);
                    markersstep.push(marker); // Ajouter le marqueur au tableau
                }
            });

            // Ajouter ou retirer les marqueurs de la carte selon l'état de la case à cocher
            if (event.target.checked) { // On coche
                markersstep.forEach(marker => marker.addTo(stepLayer));
            } else { // On décoche
                stepLayer.clearLayers(); // On retire tous les marqueurs
            }

            console.log('Données WFS:', xmlDoc);
        })
        .catch(error => console.error('Error fetching WFS data:', error));
});



//bbox
//                                                                   //                              //   EVENT BBOX  //
//////////////////////////////////////////////////////////////////////// 
document.getElementById('bboxbvorange-checkbox').addEventListener('change', function() {
    console.log("Checkbox changed, checked:", this.checked);
    //console.log("lastGeoJSON4326 value:", lastGeoJSON4326);

    // Calculer la bbox si la case est cochée et que lastGeoJSON4326 existe
    if (this.checked) {
        if (intersectedPolygon) {
            console.log("BBOX (checkbox change):", bbox);

            if (bbox) {
                var bboxPolygon = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [bbox[0], bbox[1]],
                            [bbox[2], bbox[1]],
                            [bbox[2], bbox[3]],
                            [bbox[0], bbox[3]],
                            [bbox[0], bbox[1]]
                        ]]
                    }
                };

                // Ajouter la bbox sur la carte
                L.geoJSON(bboxPolygon, {
                    style: {
                        color: 'orange',
                        fillColor: 'orange',
                        fillOpacity: 0.5
                    }
                }).addTo(map);
            }
        } else {
            console.log("No bbox to display, lastGeoJSON4326 is null.");
        }
    } else {
        // Si la case est décochée, retirer la bbox de la carte
        map.eachLayer(function(layer) {
            if (layer.feature && layer.feature.geometry && layer.feature.geometry.type === 'Polygon') {
                map.removeLayer(layer);
            }
        });
        console.log("BBOX removed from the map.");
    }
});

// Écouteur pour les établissements pollueurs
document.getElementById('pollueurs-checkbox').addEventListener('change', function(event) {
    const baseURL = 'https://georisques.gouv.fr/services';
    const params = new URLSearchParams({
        language: 'fre',
        SERVICE: 'WFS',
        REQUEST: 'GetFeature',
        VERSION: '2.0.0',
        TYPENAMES: 'ms:ETABLISSEMENTS_POLLUEURS',
        COUNT: '80000',
        SRSNAME: 'urn:ogc:def:crs:EPSG::4326',
        BBOX: `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},urn:ogc:def:crs:EPSG::4326`,
        outputFormat: 'application/json; subtype=geojson; charset=utf-8'
    });
    
    // Construire l'URL complète avec les paramètres encodés
    const urlbb = `${baseURL}?${params.toString()}`;
    console.log('URL générée:', urlbb);
    
    // Utiliser fetch pour obtenir les données
    fetch(urlbb)
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            console.log("Parsed GeoJSON:", data);
            console.log("valeurbbox or1", bbox[0]);
            console.log('Données WFS:', data);
            
            // Parse WFS data
            var markerspoll = parseWFSData(data);
            lastpollpoints = markerspoll;

            // Si la case est cochée, afficher les marqueurs
            if (event.target.checked) {
                pollutionLayer.clearLayers(); // Nettoyer la couche avant d'ajouter de nouveaux marqueurs
                markerspoll.forEach(marker => marker.addTo(pollutionLayer));
            } else {
                pollutionLayer.clearLayers(); // Si décoché, nettoyer la couche
            }
        })
        .catch(error => console.error('Error fetching WFS data:', error));
});

// Fonction pour parser les données WFS et créer des marqueurs
function parseWFSData(data) {
    var markers = [];
    var features = data.features;

    for (var i = 0; i < features.length; i++) {
        var feature = features[i];
        var geometry = feature.geometry;
        var properties = feature.properties;

        if (geometry.type === "Point") {
            var coordsep = geometry.coordinates;
            var marker = L.marker([coordsep[1], coordsep[0]], { icon: blackIcon })
            .bindPopup(Object.keys(properties).map(key => `${key}: ${properties[key]}`).join('<br>'));
                    markers.push(marker);
        }
    }

    return markers;
}

//pour les ICPE
// Écouteur pour les installations classées
 document.getElementById('icpe-checkbox').addEventListener('change', function(event) {
    
    
    
    
    // URL de base et paramètres pour les installations classées
    console.log( [latlng.lng, latlng.lat]);
    const baseURL = 'https://georisques.gouv.fr/api/v1/installations_classees';
    const latlon = latlng.lng+'%2C'+latlng.lat+'&rayon=10000'; // Exemple de coordonnées, à adapter si nécessaire
    console.log( [latlng.lng, latlng.lat])
    //{ "type": "Feature", "properties": { "gml_id": "2pts.0", "id": 1 }, "geometry": { "type": "Point", "coordinates": [ ${coords[0]}, ${coords[1]} ] } }

    
    const page = 1; // Page initiale
    const pageSize = 200; // Nombre de résultats par page
    
    // Construire l'URL complète
    const urlInstallations = `${baseURL}?latlon=${latlon}&page=${page}&page_size=${pageSize}`;
    console.log('URL générée pour installations classées:', urlInstallations);
    
    // Utiliser fetch pour obtenir les données
    fetch(urlInstallations)
        .then(response => response.json())
        .then(data => {
            console.log("Données des installations classées:", data);
            
            // Si la case est cochée, afficher les marqueurs
            if (event.target.checked) {
                icpeLayer.clearLayers(); // Nettoyer la couche avant d'ajouter de nouveaux marqueurs
                var markersInstallations = parseInstallationsData(data); // Parser les données
                markersInstallations.forEach(marker => marker.addTo(icpeLayer));
            } else {
                icpeLayer.clearLayers(); // Si décoché, nettoyer la couche
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des données des installations classées:', error));
}); 

// Fonction pour parser les données des installations classées et créer des marqueurs
function parseInstallationsData(data) {
    var markers = [];
    var installations = data.data; // En supposant que les installations sont dans 'data.data'
    
    installations.forEach(installation => {
        var coordsicpe = [installation.latitude, installation.longitude]; // Assurez-vous que les coordonnées sont dans le bon ordre (lat, lon)
        var popupContent = `
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
            <strong>Inspections:</strong> ${installation.inspections.length > 0 ? installation.inspections.map(inspection => `Date: ${inspection.dateInspection}`).join(', ') : 'Aucune'}<br>
            <strong>Date de mise à jour:</strong> ${installation.date_maj || 'Non disponible'}<br>
        `;
        
        var marker = L.marker(coordsicpe, { icon: redIcon }).bindPopup(popupContent);
        markers.push(marker);
    });

    return markers;
}








//pour les cours d'eau dans la bbox
document.getElementById('topagecebbox-checkbox').addEventListener('change', function(event) {
/*     const baseURL3 = 'https://cors-anywhere.herokuapp.com/https://services.sandre.eaufrance.fr/geo/sandre';

    const urlbb3 = `${baseURL3}?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0`
        + `&TYPENAMES=sa:CoursEau_FXX_Topage2024&SRSNAME=urn:ogc:def:crs:EPSG::4326`
        + `&BBOX=${bbox.join(',')},urn:ogc:def:crs:EPSG::4326`;

    console.log('URL générée:', urlbb3); */


    const urlbb3 = `https://services.sandre.eaufrance.fr/geo/sandre?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=sa:CoursEau_FXX_Topage2024&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bbox.join(',')} ,urn:ogc:def:crs:EPSG:`;


    // Fetch des données
    fetch(urlbb3)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.text();
    })
    .then(data => {
        addGMLToMap(data);
        //console.log('Réponse GML:', data);
          // Appel de la fonction pour ajouter les lignes à la carte
    })
    .catch(error => {
        console.error('Problème avec la requête fetch:', error);
    });

});







 // Fonction pour analyser le GML et ajouter les lignes sur la carte
            function addGMLToMap(gmlData) {
                // Extraire les LineString du GML
                console.log('addGMLToMap appelée');
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(gmlData, "text/xml");
                //console.log('xmldoc appelée', xmlDoc);
  
       // Exemple pour récupérer et transformer les LineStrings
    var lineStrings = xmlDoc.getElementsByTagName('gml:LineString');
    // Parcours de chaque LineString et transformation en GeoJSON
    for (var i = 0; i < lineStrings.length; i++) {
        var coordinates = [];
        var posList = lineStrings[i].getElementsByTagName('gml:posList')[0].textContent.trim().split(/\s+/);
        // Transformation de la liste de coordonnées en tableau de paires [lat, lon]
        for (var j = 0; j < posList.length; j += 2) {
            coordinates.push([parseFloat(posList[j + 1]), parseFloat(posList[j])]);
        }
        // Création de l'objet GeoJSON
        var geoJsonLineString = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {}
        };
        // Ajout à la carte Leaflet
        L.geoJSON(geoJsonLineString).addTo(map);
    }
        }
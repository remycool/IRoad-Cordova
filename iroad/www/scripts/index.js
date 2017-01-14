

$(document).ready(function () {
    document.addEventListener("deviceready", initialiser, false);
});


var isOnline; 
var isRotationSelected = false;
var isParcoursSelected = false;

var lat_offset_position;
var lng_offset_position;
var lat_current_position;
var lng_current_position;
var lat_current_signalement;
var lng_current_signalement;
var map;
var poly;
var position_map;
var options_map;
var DEFAULT_ZOOM = 15;
var MAX_ZOOM = 18;
var currentZoom = DEFAULT_ZOOM;
var user_marker_map;
var liste_signalement_marker_map = [];
var timer;
var nbSignalements = 0;
var watchPosition;



//Icone
var marker_img_icon = 'images/map-marker.png';
var marker_sign_police = 'images/police-marqueur.png';
var marker_sign_travaux = 'images/travaux-marqueur.png';
var marker_sign_bouchon = 'images/bouchon-marqueur.png';
var marker_sign_accident = 'images/accident-marqueur.png';

var div_carte = $("#carte-content");
var div_compass = $("#compass");
isRotationSelected ? div_compass.show() : div_compass.hide();
var div_statut = $("#header-statut");
var div_refocus = $("#button-refocus");
var div_controles = $("#controles");
var div_desc_signalement = $("#desc_signalement");
var div_network = $("#network_alert");
var div_geo = $("#geo_alert");
var div_offline = $("offline");
var SIGNALER = "https://www.fuzzdev.fr/iroad/php/signalerEvenement.php";
var RECUPERER = "https://www.fuzzdev.fr/iroad/php/recupererSignalements.php";


var isOffCenter = false;
var signalements = [];
var signalements_offline = [];
var translationHeight = 0;
var translationWidth = 0;
var current_angle = 0;

//Par défaut le centre de la carte est caché car le div
//dépasse les dimensions du viewport
function calculerTranslationMap() {

    var centreWindowWidth = $(window).width() / 2;
    var centreWindowHeight = $(window).height() / 2;
    //console.log("le centre de la fenêtre: width " +centreWindowWidth+ ", height " +centreWindowHeight);
    var centreDivMapWidth = 2000 / 2;
    var centreDivMapHeight = 2000 / 2;
    translationHeight = centreDivMapHeight - centreWindowHeight;
    translationWidth = centreDivMapWidth - centreWindowWidth;
};
calculerTranslationMap();

//Créer une map
function createMap() {

    //TODO virer les controlles de la carte
    position_map = new google.maps.LatLng(lat_current_position, lng_current_position);
    options_map = {
        zoom: DEFAULT_ZOOM,
        center: position_map,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        maxZoom: MAX_ZOOM
    };

    map = new google.maps.Map(document.getElementById('carte-content'), options_map);
    currentZoom = DEFAULT_ZOOM;
    user_marker_map = new google.maps.Marker({
        position: position_map,
        icon: marker_img_icon
    });

    //positionner le marqueur sur la carte
    user_marker_map.setMap(map);
    map.addListener('drag',
       function () {

           //afficher le bouton de recentrage
           div_refocus.fadeIn(400, 'swing');
           isOffCenter = true;
          
           //on remet à zero le timeout au cas ou on fait des "drag" successifs
           if (timer) {
               clearTimeout(timer);
           }
           //on active le timer;
           timer = recentrageAuto();

       });

    map.addListener('dragend',
    function () {
        var newCenter = map.getCenter();
        latitude = newCenter.lat();
        longitude = newCenter.lng();
        //Dévoiler les signalements
        console.log(" nouveau centre : " + latitude + " " + longitude);
        recupererSignalements(latitude, longitude);
    });

   
    map.addListener('zoom_changed',
	function (event) {
	    console.log("zoom : " + map.getZoom());
	});


};


function addLatLng() {
    //ajoute au chemin parcouru la nouvelle position
    if (!poly) {
        return;
    }
    path = poly.getPath();
    path.push(user_marker_map.getPosition());
};

//deplace le marqueur sur la carte et recentre la carte à ce marqueur
function moveMarker(lat, lng) {
    if (user_marker_map) {

        var pos = new google.maps.LatLng(lat, lng);
        user_marker_map.setPosition(pos);
        //Si l'utilisateur décentre la carte ne pas recentrer
        if (isOffCenter) {
            return;
        }
        map.panTo(pos);

    }
};

function geo_ok(position) {
	//sauvegarde de la position courante 
	lat_current_position = position.coords.latitude;
	lng_current_position = position.coords.longitude;
	console.log(lat_current_position , lng_current_position );
	lat_offset_position = lat_current_position;
	lng_offset_position = lng_current_position;
	//creation de la carte
	createMap();
	//recupérer les signalements existants
	recupererSignalements(lat_current_position,lng_current_position);

}

function geo_error(error) {
	div_geo.popup("open");

}

function geo() {
	if(navigator.geolocation){
		navigator.geolocation.getCurrentPosition(
			geo_ok,
			geo_error, 
			{ enableHighAccuracy:true, maximumAge:5000, timeout:5000}
		);
	}
}

function setHeightDivMap() {
    var viewport_height = $(window).height();
    var header_height = $("#carte-header").outerHeight();
    var footer_height = $("#carte-footer").outerHeight();
    return viewport_height - header_height - footer_height;
}

function setHeightBottomControl() {
    var footerHeight = $("#carte-footer").outerHeight();
    return footerHeight + 50;
}

//var i = 0; //itérateur de test

//Mets à jour la carte en positionnant le marqueur à la position actuelle
function updateMarkerMap(position) {
    //On sauvegarde la dernière position 
    var last_lat = lat_current_position;
    var last_lng = lng_current_position;
    //o, actualise la position
    lat_current_position = position.coords.latitude;
    lng_current_position = position.coords.longitude;
    
    var distParcourue = calculerDistanceParcourue();
    // >1km
    if (distParcourue > 1) {
        recupererSignalements(lat_current_position,lng_current_position);
        lat_offset_position = lat_current_position;
        lng_offset_position = lng_current_position;
    }

    moveMarker(lat_current_position, lng_current_position);

    //Rotation de la carte active/inactive sur paramétrage de l'appli
    if (isRotationSelected) {
        var A = new point(last_lat, last_lng);
        var B = new point(lat_current_position, lng_current_position);
        var C = new point(last_lat + 1, last_lng);
        //Si l'utilisateur décentre la carte ne pas recentrer
        if (isOffCenter) { return; }
        rotateMap(A, B, C);
    }
};

function stopAutoNavigation() {
    clearInterval(positionnement);
};

function initialiser() {
   
    document.addEventListener("offline", afficherSectionOffline, false);
    document.addEventListener("online", afficherSectionCarte, false);
    //Evite la mise en veille de l'appareil
    window.powerManagement.acquire(function () {
        console.log('Wakelock acquired');
    }, function () {
        console.log('Failed to acquire wakelock');
    });
    isOnline = navigator.onLine ? true : false;
    if (isOnline) {
        //placement du bouton de recentrage
        div_refocus.css({ "bottom": setHeightBottomControl() + "px" });
        div_controles.css({ "bottom": setHeightBottomControl() + "px", "right": div_refocus.position().left + "px" });
        //initialiser la hauteur du div map 
        div_carte.css(({ "width": "2000px", "height": "2000px", "left": "-" + translationWidth + "px", "top": "-" + translationHeight + "px" }));
        $('body').css('overflow', 'hidden')
        //cacher le bouton de recentrage
        div_refocus.hide();
        //acquérir la position actuelle
        geo();
        //surveiller la position toute les 3 secondes
        watchPosition = navigator.geolocation.watchPosition(onWatchSuccess, onWatchError, { timeout: 3000 });
    }
};

function onWatchSuccess(position) {
    updateMarkerMap(position);
};

function onWatchError(error) {
    alert('Erreur de récupération de votre position:\ncode: ' + error.code + '\n' +
              'message: ' + error.message + '\n');
};


$(document).on("pageshow", function (event, data) {
    if (map) {
        google.maps.event.trigger(map, "resize"); //permet d'éviter d'afficher une carte grisée
        if (user_marker_map) {
            map.setCenter(user_marker_map.getPosition());
        }
    }
});

//Test
//var positionnement = setInterval(updateMarkerMap, 500);

function recentrer() {
    map.panTo(user_marker_map.getPosition());
    div_refocus.fadeOut(400, 'swing');
    //on zoome la carte à la valeur enregistrée
    //map.setZoom(currentZoom);
    isOffCenter = false;
};

function recentrageAuto() {

    return setTimeout(
		function () {
		    var userPosition = user_marker_map.getPosition();
		    map.panTo(userPosition);
		    //on zoome la carte à la valeur enregistrée
		    //map.setZoom(currentZoom);
		    lat_current_position = userPosition.lat();
		    lng_current_position = userPosition.lng();
		    recupererSignalements(lat_current_position,lng_current_position);
		    div_refocus.fadeOut(400, 'swing');
		    isOffCenter = false;
		}, 5000);
};

function autoZoom() {
    currentZoom = map.getZoom();
    if (currentZoom != MAX_ZOOM) {
        map.setZoom(MAX_ZOOM);
        currentZoom = map.getZoom();
    }
};


$("#a-refocus").on('click', function () {
    recentrer();
});

$("#a-signalement").on('click', function () {
    //enregistre la position de l'évènement
    lat_current_signalement = lat_current_position;
    lng_current_signalement = lng_current_position;
    console.log("Signalement en lat :" + lat_current_signalement + ", lng : " + lng_current_signalement);

});

function createMarker(icon, signalement) {

    var markerSignalement = new google.maps.Marker({
        //position: {lat:lat_current_signalement,lng:lng_current_signalement},
        position: { lat: signalement.latitude, lng: signalement.longitude },
        icon: icon,
        map: map
    });

    addInfoWindow(markerSignalement, signalement);

    return markerSignalement;
};


function addInfoWindow(marker, signalement) {
    console.log("fonction addInfoWindow");
    var iconInfo;
    switch (signalement.evenement) {
        case '1':
            iconInfo = 'images/bouchon-btn.png';
            break;
        case '2':
            iconInfo = 'images/police-btn.png';
            break;
        case '3':
            iconInfo = 'images/accident-btn.png';
            break;
        case '4':
            iconInfo = 'images/travaux-btn.png';
            break;
    };



    google.maps.event.addListener(marker, 'click', function (event) {

        div_desc_signalement.empty();
        div_desc_signalement.append(
        "<div><center><img  class='img-btn img-center' src='" + iconInfo + "'/></center><p>Alerte relay&eacutee <strong>" + signalement.note + "</strong> fois</p><p>Signal&eacutee le :<strong>" + signalement.date + "</strong></p><p> par : <strong>" + signalement.utilisateur + "</strong></p></div>");
        div_desc_signalement.popup("open");
    });
};

//Efface tous les marqueurs de la carte
function eraseAllMarkersOnMap() {
    if (signalements.length > 0) {
        for (var i = 0; i < signalements.length; i++) {
            signalements[i].marqueur.setMap(null);
        }
    }

};



$(".img-btn").on("tap", function () {
    //Réduire la taille du bouton puis retrouve sa taille normale
    $(this).animate({ 'width': '65%', 'height': 'auto' }, 100, function () { $(this).animate({ 'width': '75%', 'height': 'auto' }), 200 });
    setTimeout(function () { window.location.href = "#carte"; }, 200);
})

function signaler(value) {

    var icon;
    var id;
    var evenement = getEvenement(value);

    if(isOnline){
        signalerEvenement(evenement.id, evenement.icon, lat_current_signalement, lng_current_signalement);
    }
    else {
        signalerEvenementOffline(evenement.id, evenement.icon, lat_current_signalement, lng_current_signalement);
    }
  

};


function  signalerEvenementOffline(id, icon, latSignalement, lngSignalement){
    var signalement = {
        id:id,
        icon:icon,
        latSignalement:latSignalement,
        lngSignalement:lngSignalement
    };
    signalements_offline.push(signalement);
    window.sessionStorage.signalement_Offline = signalements_offline;
    alert("Votre signalement en "+latSignalement+ " - "+lngSignalement+" a été pris en compte");
};

function getEvenement(value) {

    //TODO a voir pour mettre côté serveur
    var icon;
    var id;
    switch (value) {
        case 'controle':
            icon = marker_sign_police;
            id = 2;
            break;
        case 'accident':
            id = 3;
            icon = marker_sign_accident;
            break;
        case 'bouchon':
            id = 1;
            icon = marker_sign_bouchon;
            break;
        case 'travaux':
            id = 4;
            icon = marker_sign_travaux;
            break;
        case 2:
            icon = marker_sign_police;
            break;
        case 3:
            icon = marker_sign_accident;
            break;
        case 1:
            icon = marker_sign_bouchon;
            break;
        case 4:

            icon = marker_sign_travaux;
            break;


        default:
            break;
    }
    return { icon: icon, id: id };
};


function signalerEvenement(id, icon,latitude,longitude) {
    var params = {
        latitude: latitude,
        longitude: longitude,
        evenement: id
    };
    //TODO test Online
    $.post(SIGNALER, params, function (result) {
        $message = result.message;
        if (result.success) {
            recupererSignalements(latitude, longitude);
        }
    }, "json");
};


function recupererSignalements(latitude, longitude) {
    var params = {
        latitude: latitude,
        longitude: longitude
    };
   // var nbSignalementsAvant = signalements.length;
    $.post(RECUPERER, params, function (result) {
        $message = result.message;
        if (result.success == true) {

            checkSignalements(result.signalements);
            //Règle de zoom de la map
            //if (signalements.length > nbSignalementsAvant)
                //autoZoom();
        }
        console.log(nbSignalements);

    }, "json");
};

//*************************************************
//
// Vérifie les signalements entrants (remote) et
// met à jour la liste locale ainsi que l'affichage
//
//*************************************************
function checkSignalements(remote_signalements) {

    var outSign = []; //signalements expirés
    var inSign = []; //nouveau signalements

    console.log("nb signalements reçus : " + remote_signalements.length);

    //Au démarrage de l'appli, récupérer tous les signalements
    if (signalements.length == 0) {

        signalementsToLocal(remote_signalements);
        console.log("init signalements : " + signalements);
        return;
    }
    //Aucun signalements -> effacer tous les signalements
    if (remote_signalements.length == 0) {

        eraseAllMarkersOnMap();
        signalements.length = 0;
        return;
    }
    //Est-ce que le signalement en local existe  en remote?
    var isInRemote = false;
    for (var i = 0; i < signalements.length; i++) {
        for (var j = 0; j < remote_signalements.length; j++) {
            if (signalements[i].id == remote_signalements[j].Id) {
                isInRemote = true;
                break;
            }
        }
        if (!isInRemote)
            outSign.push(signalements[i]);
        isInRemote = false;
    }
    console.log("signalements à effacer : " + outSign.length);
    //Est-ce que le signalement en remote existe en local?
    var isInLocal = false;
    for (var i = 0; i < remote_signalements.length; i++) {
        for (var j = 0; j < signalements.length; j++) {
            if (remote_signalements[i].Id == signalements[j].id) {
                isInLocal = true;
                break;
            }
        }
        if (!isInLocal)
            inSign.push(remote_signalements[i]);
        isInLocal = false;
    }

    //On retire les signalement obsolètes en local
    for (var i = 0; i < outSign.length; i++) {
        if (signalement.length > 0) {
            console.log(signalements.length);
            for (var j = 0; j < signalements.length; j++) {
                if (signalements[j].id == outSign[i].id) {
                    //effacer le marqueur
                    signalements[j].marqueur.setMap(null);
                    //mettre à jour les signalements
                    signalements.splice(j, 1);
                    //on sort de la boucle
                    break;
                }
            }
        }
    }

    //on ajoute les nouveaux signalements rentrants	
    signalementsToLocal(inSign);

    console.log("Signalements à ajouter: " + inSign.length);
    console.log("Nb Signalements : " + signalements.length);
};

function signalementsToLocal(remote_signalements) {
    for (var i = 0; i < remote_signalements.length; i++) {
        var sign = new signalement(
			remote_signalements[i].Id,
			parseFloat(remote_signalements[i].Latitude),
			parseFloat(remote_signalements[i].Longitude),
			null,
			remote_signalements[i].Id_Evenement,
			remote_signalements[i].DateSignalement,
			remote_signalements[i].Login,
			remote_signalements[i].Note);
        var icon = getEvenement(parseInt(sign.evenement));
        //sign.marqueur = createMarker(icon.icon,sign.latitude,sign.longitude,sign.id);
        sign.marqueur = createMarker(icon.icon, sign);
        signalements.push(sign);
        //afficherSignalementCarte(sign);	
    }
}


//*************************************************
//
// Dessine sur la carte le parcours au fur et a mesure 
// de la progression de l'utilisateur
//
//*************************************************
function afficherParcours() {
    poly = new google.maps.Polyline({
        strokeColor: '#FF7043',
        strokeOpacity: 5,
        strokeWeight: 5
    });
    poly.setMap(map);
    map.addListener('bounds_changed', addLatLng);

};

function annulerAfficherParcours() {
    if (poly) {
        poly.setMap(null);
    }
}

function afficherSectionOffline() {
    isOnline = false;
    console.log("Hors - Ligne");
    $.mobile.changePage( "./index.html#offline", { transition: "fade", changeHash: false });
};

function afficherSectionCarte() {
    isOnline = true;
    var etat = navigator.connection.type;
    console.log(etat);
    //Dans le cas ou le chargement initial n'a pas eu lieu
    window.location.reload(true);
    //$.mobile.changePage("./index.html#carte", { transition: "slideup", changeHash: false });
    uploadSignalementToServer();
};

function uploadSignalementToServer() {
    for (var i = 0; i < signalements_offline.length; i++) {
        var s = signalements_offline[i];
        signalerEvenement(s.id, s.icon, s.latSignalement, s.lngSignalement);
    }
}

function retour() {
    if (isOnline) {
        $.mobile.changePage("index.html#carte", { transition: "fade", changeHash: false });
    } 
}
//******************************* EVENEMENTS ***************************
//

$("#flip-rotation").bind("change", function (event, ui) {
    isRotationSelected = $(this).val() == 'on' ? true : false;
    if (!isRotationSelected) {
        //Pivoter la carte jusqu'à la position initiale
        cancelRotationMap();
        //On enlève le compas
        div_compass.fadeOut(300);
    } else {
        div_compass.fadeIn(300);
    }

});

$("#flip-parcours").bind("change", function (event, ui) {
    isParcoursSelected = $(this).val() == 'on' ? true : false;
    if (isParcoursSelected) {
        afficherParcours();
    }
    else {
        annulerAfficherParcours();
    }
});



$("#a-zoomin").on('click', function () {
    currentZoom++;
    map.setZoom(currentZoom);
});

$("#a-zoomout").on('click', function () {
    currentZoom--;
    map.setZoom(currentZoom);
});
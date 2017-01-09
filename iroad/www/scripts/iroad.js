
var isOnline = navigator.onLine ? true : false;
var isRotationSelected= false;
var isParcoursSelected= false;

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
var liste_signalement_marker_map=[];
var timer;
var nbSignalements=0;

// div_desc_signalement.popup();



//Icone
var marker_img_icon = 'images/map-marker.png';
var marker_sign_police = 'images/police-marqueur.png';
var marker_sign_travaux = 'images/travaux-marqueur.png';
var marker_sign_bouchon = 'images/bouchon-marqueur.png';
var marker_sign_accident = 'images/accident-marqueur.png';

 var div_carte = $("#carte-content");
var div_compass = $("#compass");
isRotationSelected ? div_compass.show(): div_compass.hide();
var div_statut = $("#header-statut");
var div_refocus = $("#button-refocus");
var div_signalement = $("#button-signalement");
var div_desc_signalement = $("#desc_signalement");
var div_network = $("#network_alert");
var div_geo = $("#geo_alert");


var isOffCenter = false;
var signalements=[];

var translationHeight = 0;
var translationWidth = 0;
var current_angle = 0;

//Par d�faut le centre de la carte est cach� car le div
//d�passe les dimensions du viewport
function calculerTranslationMap(){
	
	var centreWindowWidth = $(window).width() / 2;
	var centreWindowHeight = $(window).height() / 2;
	//console.log("le centre de la fen�tre: width " +centreWindowWidth+ ", height " +centreWindowHeight);
	var centreDivMapWidth = 2000/2;
	var centreDivMapHeight = 2000/2;
	translationHeight = centreDivMapHeight - centreWindowHeight;
	translationWidth = centreDivMapWidth - centreWindowWidth;	
};
calculerTranslationMap();



//Cr�er une map
function createMap() {
	
	//TODO virer les controlles de la carte
    position_map = new google.maps.LatLng(lat_current_position, lng_current_position);
    options_map = {
        zoom: DEFAULT_ZOOM,
        center: position_map,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
		disableDefaultUI:true,
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
		function(){
			
			//afficher le bouton derecentrage
			div_refocus.fadeIn(400,'swing');
			isOffCenter = true;
			//on dezoome la carte
			map.setZoom(DEFAULT_ZOOM);
			//on remet � zero le timeout au cas ou on fait des "drag" successifs
			if(timer){
				clearTimeout(timer); 
			}
			//on active le timer;
			timer = recentrageAuto();
			
		});
		
		map.addListener('dragend',
		function(){
			var newCenter = map.getCenter();
			latitude = newCenter.lat();
			longitude = newCenter.lng();
			//D�voiler les signalements
			console.log(" nouveau centre : "+latitude+" "+longitude );
			recupererSignalements(latitude,longitude);
		});

	map.addListener('zoom_changed',
	function(event){
			console.log("zoom : "+ map.getZoom());	
	});
	

};

function saveConfiguration(){
alert("test");

};

function addLatLng() {
//ajoute au chemin parcouru la nouvelle position
if(!poly){
	return;
}
  path = poly.getPath();
  path.push(user_marker_map.getPosition());
};

//deplace le marqueur sur la carte et recentre la carte � ce marqueur
function moveMarker( lat,lng ) {
if(user_marker_map){
	
	var pos = new google.maps.LatLng( lat, lng );
	 user_marker_map.setPosition(pos);
		//Si l'utilisateur d�centre la carte ne pas recentrer
		if(isOffCenter){
			return;
		}
        map.panTo(pos);
		
}
};

//function geo_ok(position) {
//	//sauvegarde de la position courante 
//	lat_current_position = position.coords.latitude;
//	lng_current_position = position.coords.longitude;
//	//console.log(lat_current_position , lng_current_position );
//	lat_offset_position = lat_current_position;
//	lng_offset_position = lng_current_position;
//	//creation de la carte
//	createMap();
//	//recup�rer les signalements existants
//	recupererSignalements(lat_current_position,lng_current_position);
	
//}

//function geo_error(error) {
//	div_geo.popup("open");

//}

//function geo() {
//	if(navigator.geolocation){
//		navigator.geolocation.getCurrentPosition(
//			geo_ok,
//			geo_error, 
//			{ enableHighAccuracy:true, maximumAge:5000, timeout:5000}
//		);
//	}
//}

function setHeightDivMap(){
	var viewport_height = $(window).height();
	var header_height = $("#carte-header").outerHeight();
	var footer_height = $("#carte-footer").outerHeight();
	return viewport_height - header_height - footer_height;
}
function setHeightBottomControl(){
	var footerHeight = $("#carte-footer").outerHeight();
	return footerHeight +50 ;
}

var i =0; //it�rateur de test

//Mets � jour la carte en positionnant le marqueur � la position actuelle
function updateMarkerMap(){
	//stockage position actuelle
	$.cookie('user_latitude', lat_current_position);
	$.cookie('user_longitude', lng_current_position);
	var last_lat = lat_current_position;
	var last_lng = lng_current_position;
	//R�cup�rer les signalements en bases
			//recupererSignalements();
	var distParcourue = calculerDistanceParcourue();
	// >1km
	if(distParcourue > 1){
		recupererSignalements();
		lat_offset_position = lat_current_position;
		lng_offset_position = lng_current_position;
	}
	

	i++;
	var VALUE = 0.000001;
	//Uniquement pour des tests
	if(i<30){
		lat_current_position+=VALUE;
	lng_current_position+=VALUE;
	}else if(i>=30 && i< 50){
		lat_current_position+=VALUE;
	lng_current_position-=0.0000001;
	}else if(i>=50&& i< 70){
		lat_current_position+=VALUE;
	lng_current_position+=VALUE+0.00000001;
	}else{
		lat_current_position+=VALUE;
	lng_current_position+=VALUE;
	}
	
	moveMarker( lat_current_position, lng_current_position );

	//Rotation de la carte active/inactive sur param�trage de l'appli
	if(isRotationSelected){
		var A = new point(last_lat,last_lng);
		var B = new point(lat_current_position,lng_current_position);
		var C = new point(last_lat + 1,last_lng);
		//Si l'utilisateur d�centre la carte ne pas recentrer
		if(isOffCenter){ return;}
		rotateMap(A,B,C);
	}
};


function stopAutoNavigation(){
	clearInterval(positionnement);
};

//$(document).ready(function(){
//	//V�rification de l'�tat online/offline
//	showConnection(isOnline);
//	if(isOnline){
//		//placement du bouton de recentrage
//	div_refocus.css({"bottom" :  setHeightBottomControl()+"px"});
//	div_signalement.css({"bottom" :  setHeightBottomControl()+"px","right": div_refocus.position().left+"px"});
//	//initialiser la hauteur du div map 
//	//div_carte.css(({"width": "100%", "height": setHeightDivMap()+"px"}));
//	div_carte.css(({"width": "2000px", "height": "2000px","left":"-"+translationWidth+"px","top":"-"+translationHeight+"px"}));
//	$('body').css('overflow','hidden')
//	//cacher le bouton de recentrage
//	div_refocus.hide();
//	//acqu�rir la position actuelle
//	geo();
//	}
	
	
//});


function initialiser() {
    div_refocus.css({ "bottom": setHeightBottomControl() + "px" });
    div_signalement.css({ "bottom": setHeightBottomControl() + "px", "right": div_refocus.position().left + "px" });
    //initialiser la hauteur du div map 
    //div_carte.css(({"width": "100%", "height": setHeightDivMap()+"px"}));
    div_carte.css(({ "width": "2000px", "height": "2000px", "left": "-" + translationWidth + "px", "top": "-" + translationHeight + "px" }));
    $('body').css('overflow', 'hidden')
    //cacher le bouton de recentrage
    div_refocus.hide();
    //acqu�rir la position actuelle
    geo();
};

$(document).on("pageshow", function (event, data) {
    if (map) {
        google.maps.event.trigger(map, "resize"); //permet d'�viter d'afficher une carte gris�e
        if (user_marker_map) {
            map.setCenter(user_marker_map.getPosition());
        }
    }
});

//Test
var positionnement = setInterval(updateMarkerMap,500);

function recentrer(){
		map.panTo( user_marker_map.getPosition());
	  div_refocus.fadeOut(400,'swing');
	  //on zoome la carte � la valeur enregistr�e
	  map.setZoom(currentZoom);
	  isOffCenter =false;
};

function recentrageAuto(){
	
	return setTimeout(
		function(){
			var userPosition = user_marker_map.getPosition();
			map.panTo(userPosition);
			 //on zoome la carte � la valeur enregistr�e
	  map.setZoom(currentZoom);
			lat_current_position = userPosition.lat();
			lng_current_position = userPosition.lng();
			recupererSignalements();
			div_refocus.fadeOut(400,'swing');
			isOffCenter =false;},5000);
};

function autoZoom(){
	currentZoom= map.getZoom();
	if(currentZoom != MAX_ZOOM){
		map.setZoom(MAX_ZOOM);
		currentZoom = map.getZoom();
	}
};


$("#a-refocus").on('click', function(){
	recentrer();
});

$("#a-signalement").on('click', function(){
	//enregistre la position de l'�v�nement
		 lat_current_signalement = lat_current_position;
	 lng_current_signalement = lng_current_position;
	 console.log("Signalement en lat :"+	 lat_current_signalement +", lng : "+lng_current_signalement);
	
});

function createMarker(icon,signalement){
	
	var markerSignalement = new google.maps.Marker({
        //position: {lat:lat_current_signalement,lng:lng_current_signalement},
		position: {lat:signalement.latitude,lng:signalement.longitude},
        icon: icon,
		map:map
    });
	
	addInfoWindow(markerSignalement,signalement);
	
	return markerSignalement;
};


function addInfoWindow(marker,signalement) {
console.log("fonction addInfoWindow");
var iconInfo;
switch(signalement.evenement){
	case '1':
	iconInfo = '/iroad/images/bouchon-btn.png';
	break;
	case '2':
	iconInfo = '/iroad/images/police-btn.png';
	break;
	case '3':
	iconInfo = '/iroad/images/accident-btn.png';
	break;
	case '4':
	iconInfo = '/iroad/images/travaux-btn.png';
	break;
};



google.maps.event.addListener(marker, 'click', function (event) {

div_desc_signalement.empty();
div_desc_signalement.append(
"<div><center><img  class='img-btn img-center' src='"+iconInfo+"'/></center><p>Alerte relay&eacutee <strong>"+signalement.note+"</strong> fois</p><p>Signal&eacutee le :<strong>"+signalement.date+"</strong></p><p> par : <strong>"+signalement.utilisateur+"</strong></p></div>");
div_desc_signalement.popup( "open" );
});
};

//Efface tous les marqueurs de la carte
function eraseAllMarkersOnMap(){
	if(signalements.length>0){
		for(var i =0; i<signalements.length;i++){
			signalements[i].marqueur.setMap(null);
		}
	}
	
};

function showConnection(state){
	
	style = state ==='ONLINE' ? 'green' : 'red';
	
	div_statut.html("<span class='fa fa-signal' style='color: "+style+";'} aria-hidden='true'></span>");		
	
	if(state === 'OFFLINE'){
		//TODO afficher un message et afficher la derni�re position
		//sur la carte pr�alablement sauvegard�e
	}
};


//Gestion du offline
//window.addEventListener('online', showConnection('ONLINE'));
window.addEventListener('offline', function(){
	
div_network.popup( "open" );
	
});

//Gestion du tap sur les elements avec la classe 
$(".img-btn").on("tap",function(){
	//R�duire la taille du bouton puis retrouve sa taille normale
	$(this).animate({'width':'27%','height':'auto'},100,function(){$(this).animate({'width':'27%','height':'auto'}),200});
	setTimeout(function(){window.location.href = "#carte";},200);
})

function signaler(value){
	
	var icon;
	var id;
	var evenement = getEvenement(value);
	
	signalerEvenement(evenement.id,evenement.icon,lat_current_signalement,lng_current_signalement);
	
};


function getEvenement(value){
	
	//TODO a voir pour mettre c�t� serveur
	var icon;
	var id;
	switch(value){
		case 'controle':
		icon = marker_sign_police;
		id = 2;
		break;
		case 'accident':
		id= 3;
		icon = marker_sign_accident;
		break;
		case 'bouchon':
		id= 1;
		icon = marker_sign_bouchon;
		break;
		case 'travaux':
		id=4;
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
	return { icon : icon,id:id};
};


function signalerEvenement(id,icon){
	var params={
		latitude: lat_current_signalement,
		longitude: lng_current_signalement,
		evenement: id
	};
	$.post('./php/signalerEvenement.php', params ,function(result){
		$message = result.message;
		if(result.success){
			recupererSignalements(lat_current_signalement,lng_current_signalement);
					}
	},"json");
};


function recupererSignalements(latitude,longitude){
	var params={
		latitude: latitude,
		longitude:longitude
	};
	var nbSignalementsAvant = signalements.length;
	$.post('./php/recupererSignalements.php', params ,function(result){
		$message = result.message;
		if(result.success == true){
			
			checkSignalements(result.signalements);
			//R�gle de zoom de la map
			if(signalements.length > nbSignalementsAvant)
			autoZoom();
			}
console.log(nbSignalements);			
		
	},"json");
};

//*************************************************
//
// V�rifie les signalements entrants (remote) et
// met � jour la liste locale ainsi que l'affichage
//
//*************************************************
function checkSignalements(remote_signalements){
	
	var outSign=[]; //signalements expir�s
	var inSign=[]; //nouveau signalements
	
	console.log("nb signalements re�us : " +remote_signalements.length);
	
	//Au d�marrage de l'appli, r�cup�rer tous les signalements
	if (signalements.length == 0){
		
		signalementsToLocal(remote_signalements);
		console.log("init signalements : " + signalements);
		return;
	}
	//Aucun signalements -> effacer tous les signalements
	if (remote_signalements.length == 0){
		
		eraseAllMarkersOnMap();
		signalements.length= 0;
		return;
	}
	//Est-ce que le signalement en local existe  en remote?
	var isInRemote=false; 
	for(var i=0;i<signalements.length;i++)
	{
		for(var j=0;j<remote_signalements.length;j++){
			if(signalements[i].id == remote_signalements[j].Id){
				isInRemote=true;
				break;
			}
		}
		if(!isInRemote)
			outSign.push(signalements[i]);
		isInRemote= false;
	}
	console.log("signalements � effacer : " + outSign.length);
	//Est-ce que le signalement en remote existe en local?
	var isInLocal=false;
	for(var i=0;i<remote_signalements.length;i++)
	{
		for(var j=0;j<signalements.length;j++)
		{
			if(remote_signalements[i].Id == signalements[j].id){
				isInLocal = true;
				break;
			}
		}
		if(!isInLocal)
			inSign.push(remote_signalements[i]);
		isInLocal = false;
	}
	
		//On retire les signalement obsol�tes en local
	for (var i=0; i<outSign.length;i++)
	{
		if(signalement.length>0)
		{
			console.log(signalements.length);
			for(var j=0;j<signalements.length;j++)
			{
				if(signalements[j].id == outSign[i].id)
				{
					//effacer le marqueur
					signalements[j].marqueur.setMap(null);
					//mettre � jour les signalements
					signalements.splice(j,1);
					//on sort de la boucle
					break;
				}
			}		
		}
	}

	//on ajoute les nouveaux signalements rentrants	
	signalementsToLocal(inSign);
	
	console.log("Signalements � ajouter: " +inSign.length);
	console.log("Nb Signalements : " + signalements.length);
};

function signalementsToLocal(remote_signalements){
	for(var i=0;i<remote_signalements.length;i++){
		var sign = new signalement(
			remote_signalements[i].Id,
			parseFloat(remote_signalements[i].Latitude),
			parseFloat(remote_signalements[i].Longitude),
			null,
			remote_signalements[i].Id_Evenement,
			remote_signalements[i].DateSignalement,
			remote_signalements[i].Id_Utilisateur,
			remote_signalements[i].Note);
		var icon = getEvenement(parseInt(sign.evenement));
		//sign.marqueur = createMarker(icon.icon,sign.latitude,sign.longitude,sign.id);
		sign.marqueur = createMarker(icon.icon,sign);
		signalements.push(sign);
		//afficherSignalementCarte(sign);	
	}	
}



function afficherParcours(){
	poly = new google.maps.Polyline({
    strokeColor: '#FF7043',
    strokeOpacity: 5,
    strokeWeight: 5
  });
  poly.setMap(map);
	map.addListener('bounds_changed', addLatLng);
	
};

function annulerAfficherParcours(){
	if(poly){
		poly.setMap(null);
	}
}


//******************************* EVENEMENTS ***************************
//

$( "#flip-rotation" ).bind( "change", function(event, ui) {
	isRotationSelected = $(this).val() == 'on' ? true:false;
	if(!isRotationSelected){
		//Pivoter la carte jusqu'� la position initiale
		cancelRotationMap();
		//On enl�ve le compas
		div_compass.fadeOut(300);
	}else{
		div_compass.fadeIn(300);
	}

});

$( "#flip-parcours" ).bind( "change", function(event, ui) {
	isParcoursSelected = $(this).val() == 'on' ? true:false;
	if(isParcoursSelected){
		afficherParcours();
	}
	else{
		annulerAfficherParcours();
	}
});



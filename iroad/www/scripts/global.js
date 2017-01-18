//Icone
var MARKER_POSITION = 'images/map-marker.png';
var MARKER_POLICE = 'images/police-marqueur.png';
var MARKER_TRAVAUX = 'images/travaux-marqueur.png';
var MARKER_BOUCHON = 'images/bouchon-marqueur.png';
var MARKER_ACCIDENT = 'images/accident-marqueur.png';

var ICON_POLICE = 'images/police-btn.png';
var ICON_BOUCHON = 'images/bouchon-btn.png';
var ICON_ACCIDENT = 'images/accident-btn.png';
var ICON_TRAVAUX = 'images/travaux-btn.png';

var div_carte = $("#carte-content");
var div_compass = $("#compass");
var div_statut = $("#header-statut");
var div_refocus = $("#button-refocus");
var div_controles = $("#controles");
var div_desc_signalement = $("#desc_signalement");
var div_network = $("#network_alert");
var div_geo = $("#geo_alert");
var div_offline = $("offline");
var SIGNALER = "https://www.fuzzdev.fr/iroad/php/signalerEvenement.php";
var RECUPERER = "https://www.fuzzdev.fr/iroad/php/recupererSignalements.php";
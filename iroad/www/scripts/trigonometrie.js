class point {
	constructor(lat,lng){
		this.lat = lat;
		this.lng = lng;
	}
};

var current_angle = 0;

//Calculer angle arccos[(b² + c² - a²) / 2bc]
function getAngle(a,b,c){
	var x = ( Math.pow(b,2) + Math.pow(c,2) - Math.pow(a,2) ); //(b² + c² - a²)
	var z = 2 * b * c;
	var radians = Math.acos(x/z);
	return radians * 180 / Math.PI;
} ;

//Caculer les distances entre deux points
function getDistance(pointA,pointB){
	var lat = pointB.lat - pointA.lat;
	var lat_sq = Math.pow(lat,2);
	var lng = pointB.lng - pointA.lng;
	var lng_sq = Math.pow(lng,2);
	
	return Math.sqrt(lat_sq + lng_sq);	
};

//Orienter la carte dans le sens de conduite basé sur la méthode de triangulisation
function rotateMap(pointA,pointB,pointC){

	//avec les trois points on va calculer leur distances respectives
	var c = getDistance(pointA,pointB);
	var b = getDistance(pointA,pointC);
	var a =  getDistance(pointC,pointB);
	
	//à partir des distances connues on calcule l'angle origine
	last_angle = current_angle;
	current_angle = getAngle(a,b,c);
	if(pointA.lng<pointB.lng){
		current_angle= - current_angle;
	}
	//Rotation du div avec CSS3
	if(current_angle != last_angle){
		$({deg:last_angle}).animate({deg: current_angle}, {
        duration: 3000,
        step: function(now){
            div_carte.css({
                 transform: "rotate(" + now + "deg)",
            });
			div_compass.css({
                 transform: "rotate(" + now + "deg)",
            });
        }
    });
	}
   
	
};

//annuler la rotation de la carte
function cancelRotationMap(){
	$({deg:last_angle}).animate({deg: 0}, {
        duration: 3000,
        step: function(now){
            div_carte.css({
                 transform: "rotate(" + now + "deg)",
            });
			div_compass.css({
                 transform: "rotate(" + now + "deg)",
            });
        }
    });

}

function calculerDistanceParcourue(){
	
  var R = 6371; // Rayon de la terre
  var dLat = radians(lat_current_position-lat_offset_position);  
  var dLon = radians(lng_current_position-lng_offset_position); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(radians(lat_offset_position)) * Math.cos(radians(lat_current_position)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
	
};
	
function radians(deg) {
  return deg * (Math.PI/180)
}
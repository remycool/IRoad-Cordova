<?php
session_start();


$latitude = $_POST["latitude"];
$longitude = $_POST["longitude"];
$evenement = $_POST["evenement"];

$result = NULL;
$message = "";
$success = false;
$isNew = false;

//formule de calcul des distances
$formule="(6366*acos(cos(radians($latitude))*cos(radians(`Latitude`))*cos(radians(`Longitude`) -radians($longitude))+sin(radians($latitude))*sin(radians(`Latitude`))))";

try{
	
	//Rechercher le premier signalement à moins de 50 m  
	
$bdd = new PDO("mysql:host=localhost;port=3306;dbname=iroad;charset=utf8", "root", "fig91?");
$bdd->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$query1 = $bdd->prepare("SELECT Id,  $formule AS dist FROM signalement WHERE $formule<=0.05 AND Id_Evenement = ?  ORDER by dist ASC");
$query1->execute(array($evenement));
$signalement = $query1->fetch();

//Si un signalement existe pour le même évènement alors on incrémente la note du signalement déjà enregistré
if($signalement){
	
	$idSignal = $signalement["Id"];
	$query2 = $bdd->prepare(" UPDATE signalement SET NOTE = NOTE +1  WHERE Id = ? ");
$send1 = $query2 -> execute(array($idSignal));
if($send1){
	$success = true;
}
}
else{
	//Insérer un nouveau signalement dans la table
	$query3 = $bdd->prepare("INSERT INTO signalement (Latitude,Longitude,DateSignalement,Note,Id_Evenement,Id_Utilisateur) VALUES (?,?,?,?,?,?)");
$send2 = $query3 -> execute(array(
$latitude,
$longitude,
date("Y-m-d H:i:s"),
1,
$evenement,
3
));
if($send2){
	$success = true;
	$isNew = true;
}
}


}
catch (Exception $e){
	$message = "Erreur : ". $e->getMessage();
}	


$result=array(
"success" => $success,
"message" => $message,
"nouveau" => $isNew
);

echo json_encode($result);
?>
<?php
session_start();


$current_latitude = $_POST["latitude"];
$current_longitude = $_POST["longitude"];

class Signalement
{
    public $Id;
    public $Id_Evenement;
	public $Latitude;
	public $Longitude;
}
$signalements = array();
$message = "";
$success = false;
$result= NULL;

//formule de calcul des distances
$formule="(6366*acos(cos(radians($current_latitude))*cos(radians(`Latitude`))*cos(radians(`Longitude`) -radians($current_longitude))+sin(radians($current_latitude))*sin(radians(`Latitude`))))";

try{
	
$bdd = new PDO("mysql:host=localhost;port=3306;dbname=iroad;charset=utf8", "root", "fig91?");
$bdd->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$query1 = $bdd->prepare("SELECT Id , Id_Evenement ,Latitude,Longitude, $formule AS dist , DateSignalement, Id_Utilisateur , Note FROM signalement WHERE $formule<=5 AND Note > 0 ORDER by dist ASC");
$query1->execute();
$rows = $query1->fetchAll();

 if($rows){
	
	 $success = true;
	// $item = new Signalement();
	// $item ->Id= $row["Id"];
	// $item ->Id_Evenement = $row["Id_Evenement"];
	// $item ->Latitude = (float)$row["Latitude"];
	// $item ->Longitude = (float)$row["Longitude"];
	// array_push($signalements,$item);
 }

}
catch (Exception $e){
	$message = "Erreur : ". $e->getMessage();
}	


$result=array(
"success" => $success,
"message" => $message,
"signalements"=> $rows
);

echo json_encode($result);
?>
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json");

$servername = "localhost";
$dbname = "isga";
$username = "root";
$password = "";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

// Get the CO2 from O2 setting
$sql = "SELECT use_co2_from_o2 FROM co2_settings LIMIT 1";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode(["use_co2_from_o2" => (int)$row["use_co2_from_o2"]]);
} else {
    // Default value if not set
    echo json_encode(["use_co2_from_o2" => 0]);
}

$conn->close();
?>

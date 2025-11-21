<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit();
}

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

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $use_co2_from_o2 = isset($_POST['use_co2_from_o2']) ? intval($_POST['use_co2_from_o2']) : 0;
    
    // Create table if it doesn't exist
    $createTableSql = "CREATE TABLE IF NOT EXISTS co2_settings (
        id INT PRIMARY KEY DEFAULT 1,
        use_co2_from_o2 TINYINT(1) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $conn->query($createTableSql);
    
    // Insert or update the setting
    $sql = "INSERT INTO co2_settings (id, use_co2_from_o2) VALUES (1, ?) 
            ON DUPLICATE KEY UPDATE use_co2_from_o2 = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to prepare statement"]);
        $conn->close();
        exit();
    }
    
    $stmt->bind_param("ii", $use_co2_from_o2, $use_co2_from_o2);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "use_co2_from_o2" => $use_co2_from_o2]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save setting"]);
    }
    
    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(["error" => "Only POST requests are accepted"]);
}

$conn->close();
?>

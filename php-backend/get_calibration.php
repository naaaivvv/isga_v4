<?php
// Disable error display to prevent HTML in JSON response
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit();
}

try {
    $servername = "localhost";
    $dbname = "isga";
    $username = "root";
    $password = "";

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'calibration'");
    if ($tableCheck->num_rows === 0) {
        echo json_encode([]);
        $conn->close();
        exit();
    }

    $sql = "SELECT 
        gas_type, 
        reference_value, 
        readings, 
        average,
        t_value, 
        passed, 
        correction_slope, 
        correction_intercept,
        updated_at 
    FROM calibration";

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $calibrations = [];
    while ($row = $result->fetch_assoc()) {
        $gas_type = $row['gas_type'];
        
        // Decode readings JSON
        $readings = json_decode($row['readings'], true);
        if ($readings === null) {
            $readings = [];
        }
        
        $calibrations[$gas_type] = [
            'gas_type' => $gas_type,
            'reference_value' => floatval($row['reference_value']),
            'readings' => $readings,
            'average' => floatval($row['average']),
            't_value' => $row['t_value'] !== null ? floatval($row['t_value']) : null,
            'passed' => intval($row['passed']),
            'correction_slope' => floatval($row['correction_slope']),
            'correction_intercept' => floatval($row['correction_intercept']),
            'updated_at' => $row['updated_at']
        ];
    }

    echo json_encode($calibrations);
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
?>

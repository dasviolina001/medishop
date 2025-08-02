<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database configuration
$servername = "localhost";
$username = "root"; // Default XAMPP username
$password = "";     // Default XAMPP password
$dbname = "medishop_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

// Fetch medicines
$sql = "SELECT id, name, description, price, image FROM medicines WHERE stock > 0";
$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    die(json_encode(['error' => 'Query failed: ' . $conn->error]));
}

$medicines = [];
while ($row = $result->fetch_assoc()) {
    $medicines[] = [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'price' => (float)$row['price'],
        'image' => $row['image']
    ];
}

$conn->close();

echo json_encode($medicines);
?>
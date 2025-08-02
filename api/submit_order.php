<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "medishop_db";

// Get input data
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate input
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit;
}

if (!isset($data['customer'], $data['items'], $data['total'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $conn->beginTransaction();
    
    // Insert order
    $stmt = $conn->prepare("INSERT INTO orders 
        (customer_name, email, address, city, zip_code, total, payment_method) 
        VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['customer']['name'],
        $data['customer']['email'],
        $data['customer']['address'],
        $data['customer']['city'],
        $data['customer']['zipCode'],
        $data['total'],
        $data['payment_method'] ?? 'card'
    ]);
    
    $orderId = $conn->lastInsertId();
    
    // Insert items
    $itemStmt = $conn->prepare("INSERT INTO order_items 
        (order_id, medicine_id, quantity, price) 
        VALUES (?, ?, ?, ?)");
    
    foreach ($data['items'] as $item) {
        $itemStmt->execute([
            $orderId,
            $item['id'],
            $item['quantity'],
            $item['price']
        ]);
        
        // Update stock
        $conn->exec("UPDATE medicines SET stock = stock - {$item['quantity']} WHERE id = {$item['id']}");
    }
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'order_id' => $orderId,
        'message' => 'Order placed successfully'
    ]);
    
} catch(PDOException $e) {
    if (isset($conn)) $conn->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
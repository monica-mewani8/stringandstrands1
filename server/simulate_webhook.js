// simulate_webhook.js
// This script simulates Shiprocket sending a webhook event to your local server.

async function simulateWebhook() {
  const payload = {
    // We are simulating a Shiprocket Order ID here.
    // Replace this with an actual shiprocket_order_id from your database if you want to see a real update.
    order_id: "test-shiprocket-id-12345", 
    current_status: "DISPATCHED", // Test status
    awb: "AWB987654321",
    courier_name: "Delhivery"
  };

  console.log("Simulating Shiprocket Webhook Event:", payload);

  try {
    const response = await fetch('http://localhost:3001/api/shiprocket/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Server Response:", response.status, data);
  } catch (err) {
    console.error("Error communicating with local server. Is it running on port 3001?", err.message);
  }
}

simulateWebhook();

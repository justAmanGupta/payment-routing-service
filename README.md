# Payment Gateway Routing Service

## API Endpoints

### POST /transactions/initiate
Initiates a new payment transaction by selecting an appropriate gateway and creating a transaction record.

Request:
```json
{
  "order_id": "ORD123",
  "amount": 499.0,
  "payment_instrument": {
    "type": "card",
    "card_number": "****",
    "expiry": "MM/YY"
  }
}
```

Response:
```json
{
  "success": true,
  "transaction": {
    "id": "TXN_1705089000123_abc123xyz",
    "order_id": "ORD123",
    "amount": 499.0,
    "status": "pending",
    "gateway": "razorpay",
    "created_at": "2026-01-12T18:30:00.000Z"
  },
  "gateway_response": {
    "id": "rzp_ABC123XYZ",
    "entity": "order",
    "amount": 49900,
    "currency": "INR",
    "status": "created"
  }
}
```

### POST /transactions/callback
Processes callbacks from payment gateways after transaction completion. The endpoint handles different callback formats from various gateways and updates transaction status accordingly.

Request:
```json
{
  "order_id": "ORD123",
  "status": "success",
  "gateway": "razorpay",
  "reason": "Customer Cancelled"
}
```

Response:
```json
{
  "success": true,
  "message": "Callback processed successfully",
  "transaction": {
    "id": "TXN_1705089000123_abc123xyz",
    "order_id": "ORD123",
    "status": "success",
    "gateway": "razorpay",
    "updated_at": "2026-01-12T18:31:00.000Z"
  }
}
```

### GET /transactions/:orderId
Retrieves transaction details by order ID.

### GET /transactions/stats/summary
Returns system statistics like transaction counts, routing distribution, and gateway health metrics.

Response:
```json
{
  "success": true,
  "stats": {
    "transactions": {
      "total": 10,
      "pending": 2,
      "success": 6,
      "failure": 2
    },
    "routing": {
      "totalGateways": 3,
      "healthyGateways": 3,
      "unhealthyGateways": 0,
      "healthyList": ["razorpay", "payu", "cashfree"],
      "unhealthyList": []
    },
    "gateway_health": [
      {
        "gateway": "razorpay",
        "isHealthy": true,
        "successRate": 0.95,
        "successCount": 19,
        "failureCount": 1,
        "totalEvents": 20,
        "unhealthyUntil": null
      }
    ]
  }
}
```

## Setup and Installation

### Prerequisites
- Node.js 18 or higher
- npm or Docker

### Local Development

Install dependencies:
```bash
npm install
```

Start the server:
```bash
npm start
```

Run tests:
```bash
npm test
```

The service will start on port 3000. You can test the health endpoint:
```bash
curl http://localhost:3000/health
```

### Docker Deployment

Build the image:
```bash
docker build -t payment-gateway-routing .
```

Run the container:
```bash
docker run -p 3000:3000 payment-gateway-routing
```


## Testing

- Unit tests for health monitoring and routing logic
- Integration tests for API endpoints
- Test scenarios for success and failure cases

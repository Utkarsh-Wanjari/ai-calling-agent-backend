const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const customers = require("./customers.json");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = {
  calls: {
    create: async () => {
      return { sid: "FAKE_CALL_SID_123" };
    }
  }
};

/**
 * Health check
 */
app.get("/", (req, res) => {
  res.send("AI Calling Agent Backend is running");
});

/**
 * GET /customers
 * Returns all customers
 */
app.get("/customers", (req, res) => {
  res.status(200).json(customers);
});

/**
 * GET /customers/:id
 * Returns a single customer by ID
 */
app.get("/customers/:id", (req, res) => {
  const customer = customers.find(
    (c) => c.id === parseInt(req.params.id)
  );

  if (!customer) {
    return res.status(404).json({
      message: "Customer not found"
    });
  }

  res.status(200).json(customer);
});

/**
 * POST /call
 * Triggers a call only if order_status is pending or delayed
 */
app.post("/call", async (req, res) => {
  const { name, number, order_status } = req.body;

  // Simple AI-like rule
  if (!["pending", "delayed"].includes(order_status)) {
    return res.status(400).json({
      message: `Call not allowed. Order status is ${order_status}`
    });
  }

  try {
    const call = await client.calls.create({
      to: number,
      from: process.env.TWILIO_PHONE,
      twiml: `
        <Response>
          <Say>
            Hello ${name}. Your order is currently ${order_status}.
            Our team will contact you soon.
          </Say>
        </Response>
      `
    });

    res.status(200).json({
      message: "Call triggered successfully",
      callSid: call.sid
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to trigger call",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


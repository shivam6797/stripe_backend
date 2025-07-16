require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 9000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency, description, customerDetails, metadata } = req.body;

    // ✅ Step 1: Create Customer with full details
    const customer = await stripe.customers.create({
      name: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone || undefined, // ✅ optional phone
      description: customerDetails.description || undefined, // ✅ added
      address: {
        line1: customerDetails.address.line1,
        city: customerDetails.address.city,
        state: customerDetails.address.state,
        postal_code: customerDetails.address.postalCode,
        country: customerDetails.address.country,
      },
    });

    // ✅ Step 2: Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        phone: customerDetails.phone || "N/A",
        summary: description || "No summary",
        ...(metadata || {}), // ✅ merge frontend metadata if any
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

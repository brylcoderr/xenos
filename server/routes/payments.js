const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId).populate('client');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: invoice.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${invoice.invoiceNumber}: ${item.description}`,
          },
          unit_amount: Math.round(item.rate * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invoices/${invoiceId}?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/invoices/${invoiceId}?payment=cancelled`,
      metadata: { invoiceId: invoiceId.toString() },
    });

    invoice.stripeCheckoutSessionId = session.id;
    await invoice.save();

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook for Stripe to notify us of payment
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata.invoiceId;

    const invoice = await Invoice.findById(invoiceId);
    if (invoice) {
      invoice.status = 'Paid';
      invoice.paidAt = new Date();
      invoice.stripePaymentIntentId = session.payment_intent;
      await invoice.save();

      await Activity.create({
        type: 'invoice_paid',
        description: `Stripe Payment received for Invoice ${invoice.invoiceNumber}`,
        entityType: 'invoice',
        entityId: invoice._id,
        metadata: { amount: invoice.total, source: 'stripe' }
      });
    }
  }

  res.json({ received: true });
});

module.exports = router;

const express = require('express');
const Invoice = require('../models/Invoice');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');
const { generatePDF } = require('../utils/export');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, client, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (client) query.client = client;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('client', 'name company email')
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find();
    
    const stats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'Draft').length,
      pending: invoices.filter(i => i.status === 'Pending').length,
      sent: invoices.filter(i => i.status === 'Sent').length,
      paid: invoices.filter(i => i.status === 'Paid').length,
      overdue: invoices.filter(i => i.status === 'Overdue').length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
      paidAmount: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.total || 0), 0),
      pendingAmount: invoices.filter(i => ['Pending', 'Sent'].includes(i.status)).reduce((sum, i) => sum + (i.total || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('project')
      .populate('createdBy', 'name email');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const invoiceNumber = lastInvoice 
      ? `INV-${String(parseInt(lastInvoice.invoiceNumber.replace('INV-', '')) + 1).padStart(4, '0')}`
      : 'INV-0001';

    const invoice = new Invoice({
      ...req.body,
      invoiceNumber,
      createdBy: req.user._id
    });
    await invoice.save();

    await Activity.create({
      type: 'invoice_created',
      description: `Invoice ${invoice.invoiceNumber} created`,
      user: req.user._id,
      entityType: 'invoice',
      entityId: invoice._id
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/send', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Sent',
        sentAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('client');

    await Activity.create({
      type: 'invoice_sent',
      description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.client.name}`,
      user: req.user._id,
      entityType: 'invoice',
      entityId: invoice._id
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/mark-paid', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Paid',
        paidAt: new Date(),
        paidDate: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('client');

    await Activity.create({
      type: 'invoice_paid',
      description: `Invoice ${invoice.invoiceNumber} marked as paid`,
      user: req.user._id,
      entityType: 'invoice',
      entityId: invoice._id,
      metadata: { amount: invoice.total }
    });

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/export/pdf', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('project');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const itemsHTML = invoice.items.map(item => 
      `<tr><td>${item.description}</td><td>${item.quantity}</td><td>$${item.rate}</td><td>$${item.amount}</td></tr>`
    ).join('');

    const htmlContent = `
      <h2>INVOICE</h2>
      <table>
        <tr><td><strong>Invoice #:</strong></td><td>${invoice.invoiceNumber}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${new Date(invoice.createdAt).toLocaleDateString()}</td></tr>
        <tr><td><strong>Due Date:</strong></td><td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td></tr>
      </table>

      <h3>Bill To:</h3>
      <p>
        <strong>${invoice.client.name}</strong><br>
        ${invoice.client.company || ''}<br>
        ${invoice.client.email}<br>
        ${invoice.client.address || ''}
      </p>

      <h3>Items</h3>
      <table>
        <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        ${itemsHTML}
        <tr><td colspan="3"><strong>Subtotal</strong></td><td>$${invoice.subtotal?.toFixed(2)}</td></tr>
        <tr><td colspan="3">Tax (${invoice.taxRate}%)</td><td>$${((invoice.subtotal || 0) * invoice.taxRate / 100).toFixed(2)}</td></tr>
        <tr><td colspan="3"><strong>Total</strong></td><td><strong>$${invoice.total?.toFixed(2)}</strong></td></tr>
      </table>

      ${invoice.notes ? `<h3>Notes</h3><p>${invoice.notes}</p>` : ''}
    `;

    const pdfBuffer = await generatePDF(htmlContent, {
      name: invoice.invoiceNumber,
      type: 'Invoice'
    });

    const binaryBuffer = Buffer.from(pdfBuffer);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', binaryBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.end(binaryBuffer);
  } catch (error) {
    console.error('Invoice PDF Export Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await Activity.create({
      type: 'invoice_deleted',
      description: `Invoice ${invoice.invoiceNumber} deleted`,
      user: req.user._id,
      entityType: 'invoice',
      entityId: invoice._id
    });

    await invoice.deleteOne();
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

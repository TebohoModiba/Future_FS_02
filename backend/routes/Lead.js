const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const protect = require('../middleware/auth');

// Get all leads (protected)
router.get('/', protect, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new lead (public - from website form)
router.post('/', async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const saved = await lead.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update lead status or add note (protected)
router.put('/:id', protect, async (req, res) => {
  try {
    const { status, note, notes } = req.body;
    const lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ message: "Lead not found" });

    if (status) lead.status = status.toLowerCase();

    const noteText = note || notes;
    if (noteText && noteText.trim()) {
      lead.notes.push({ text: noteText.trim() });
    }

    await lead.save();
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});                                           // ← this was missing

// Delete a lead (protected)
router.delete('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
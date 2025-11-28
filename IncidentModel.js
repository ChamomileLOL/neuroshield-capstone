const mongoose = require('mongoose');

// Define the shape of a "Log Entry"
const IncidentSchema = new mongoose.Schema({
    content: String,       // e.g., "BAD FISH ROTTEN SMELL..."
    type: String,          // e.g., "TRIGGER"
    timestamp: { 
        type: Date, 
        default: Date.now  // Automatically mark the time
    }
});

// Create the Model
const Incident = mongoose.model('Incident', IncidentSchema);

module.exports = Incident;
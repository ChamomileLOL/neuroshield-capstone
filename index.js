// 1. LOAD ENVIRONMENT VARIABLES (Must be at the very top)
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');

// IMPORT TOOLS
const BloomFilter = require('./BloomFilter');
const Trie = require('./Trie');
const Incident = require('./IncidentModel');

const app = express();
app.use(cors());
// --- NEW: API TO FETCH HISTORY ---
app.get('/api/history', async (req, res) => {
    try {
        // Fetch the last 10 incidents, sorted by newest first
        const history = await Incident.find().sort({ timestamp: -1 }).limit(10);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

// --- 2. CONNECT TO MONGODB ATLAS (USING .ENV) ---
const uri = process.env.MONGO_URI; // <--- This reads from your .env file

if (!uri) {
    console.error("CRITICAL ERROR: MONGO_URI is missing in .env file!");
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => console.log(">> MEMORY CORE (ATLAS CLOUD): CONNECTED SUCCESSFULLY"))
    .catch(err => console.error(">> MEMORY ERROR: Connection Failed!", err));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- SECURITY TOOLS ---
const dirtyFilter = new BloomFilter(100);
dirtyFilter.add("DIRTY_WORD_XXX");

const triggerTrie = new Trie();
const triggers = [
    "MURMURING",
    "SCREAMING",
    "AGGRESSIVE SCREAMING IN BHOJPURI",
    "MURMURING IN VERNACULAR MARATHI",
    "GOSSIPPING",
    "SINGING BHOJPURI SONGS",
    "MAKING CROW SOUNDS",
    "INDIAN MALE DOG BARKING",
    "LOCAL GOSSIP SESSIONS",
    "BAD FISH ROTTEN SMELL OF INDIAN FISHERWOMEN",
    "TOBACCO SMELL"
];
triggers.forEach(t => triggerTrie.insert(t));


// --- THE NEIGHBOR SIMULATION ---
function startNeighbor(socket) {
    console.log("Neighbor: *Starts existing loudly*");

    const neighborInterval = setInterval(async () => {
        
        const soundProfile = [
            { text: "Just walking around", type: "SAFE" },
            { text: "Cooking in the kitchen", type: "SAFE" },
            { text: "Watching TV at low volume", type: "SAFE" },
            // TRIGGERS
            { text: "MURMURING", type: "POTENTIAL_TRIGGER" },
            { text: "SCREAMING", type: "POTENTIAL_TRIGGER" },
            { text: "AGGRESSIVE SCREAMING IN BHOJPURI", type: "POTENTIAL_TRIGGER" },
            { text: "MURMURING IN VERNACULAR MARATHI", type: "POTENTIAL_TRIGGER" },
            { text: "GOSSIPPING", type: "POTENTIAL_TRIGGER" },
            { text: "SINGING BHOJPURI SONGS", type: "POTENTIAL_TRIGGER" },
            { text: "MAKING CROW SOUNDS", type: "POTENTIAL_TRIGGER" },
            { text: "INDIAN MALE DOG BARKING", type: "POTENTIAL_TRIGGER" },
            { text: "BAD FISH ROTTEN SMELL OF INDIAN FISHERWOMEN", type: "POTENTIAL_TRIGGER" },
            { text: "TOBACCO SMELL", type: "POTENTIAL_TRIGGER" }
        ];

        let randomSound = soundProfile[Math.floor(Math.random() * soundProfile.length)];
        let message = randomSound.text;
        let finalType = "NOISE";

        if (Math.random() < 0.1) message = "DIRTY_WORD_XXX";

        // --- PROCESSING ---
        if (dirtyFilter.contains(message)) {
            message = "[CENSORED TO PROTECT SANITY]";
            finalType = "SAFE_NOISE";
        } 
        else {
            const detected = triggerTrie.searchInSentence(message);
            
            if (detected) {
                console.log(`!!! TRIGGER DETECTED: ${detected} !!!`);
                finalType = "TRIGGER"; 

                // SAVE TO CLOUD DB
                try {
                    const newIncident = new Incident({
                        content: message,
                        type: "TRIGGER"
                    });
                    await newIncident.save(); 
                    console.log(">> INCIDENT LOGGED TO CLOUD DB");
                } catch (e) {
                    console.log("Failed to save to DB:", e.message);
                }
            } else {
                finalType = "SAFE_NOISE";
            }
        }

        socket.emit("neighbor_event", {
            id: Date.now(),
            type: finalType,
            content: message
        });

    }, 1500); 

    socket.on("disconnect", () => clearInterval(neighborInterval));
}

io.on("connection", (socket) => {
    console.log(`Xavier Connected: ${socket.id}`);
    startNeighbor(socket);
});

// Use the PORT from .env, or default to 3001
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`NEOCORTEX ONLINE: Listening on Port ${PORT}`);
});
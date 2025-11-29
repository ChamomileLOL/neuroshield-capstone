// 1. LOAD ENVIRONMENT VARIABLES
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

// --- API TO FETCH HISTORY ---
app.get('/api/history', async (req, res) => {
    try {
        const history = await Incident.find().sort({ timestamp: -1 }).limit(20); // Increased to 20
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch history" });
    }
});

// --- CONNECT TO MONGODB ATLAS ---
const uri = process.env.MONGO_URI;
if (!uri) {
    console.error("CRITICAL ERROR: MONGO_URI is missing in .env file!");
    process.exit(1);
}
mongoose.connect(uri)
    .then(() => console.log(">> MEMORY CORE: CONNECTED"))
    .catch(err => console.error(">> MEMORY ERROR:", err));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- SECURITY TOOLS ---
const dirtyFilter = new BloomFilter(100);
dirtyFilter.add("DIRTY_WORD_XXX");

const triggers = [
    "MURMURING", "SCREAMING", "AGGRESSIVE SCREAMING IN BHOJPURI",
    "MURMURING IN VERNACULAR MARATHI", "GOSSIPPING", "SINGING BHOJPURI SONGS",
    "MAKING CROW SOUNDS", "INDIAN MALE DOG BARKING", "LOCAL GOSSIP SESSIONS",
    "BAD FISH ROTTEN SMELL OF INDIAN FISHERWOMEN", "TOBACCO SMELL"
];
// (Trie is kept for legacy, but we use Pattern Matching now)
const triggerTrie = new Trie();
triggers.forEach(t => triggerTrie.insert(t));


// --- THE GLOBAL NEIGHBOR (RUNS 24/7) ---
// Note: We pass 'io' so we can broadcast to anyone listening
function startGlobalSimulation(io) {
    console.log(">> GLOBAL SIMULATION STARTED: Neighbor is active.");

    setInterval(async () => {
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
            // PATTERN MATCHER (Supports "TOBACCO SMELL")
            let detected = null;
            for (const t of triggers) {
                if (message.includes(t)) {
                    detected = t;
                    break;
                }
            }
            
            if (detected) {
                console.log(`!!! TRIGGER DETECTED: ${detected} !!!`);
                finalType = "TRIGGER"; 

                // SAVE TO CLOUD DB (Always saves, even if no one is watching)
                try {
                    const newIncident = new Incident({
                        content: message,
                        type: "TRIGGER"
                    });
                    await newIncident.save(); 
                } catch (e) {
                    console.log("DB Error:", e.message);
                }
            } else {
                finalType = "SAFE_NOISE";
            }
        }

        // BROADCAST TO WORLD
        // If Xavier is watching, he hears it. If not, it falls into the void (but is saved to DB).
        io.emit("neighbor_event", {
            id: Date.now(),
            type: finalType,
            content: message
        });

    }, 3000); // Slower pace (3 seconds) for 24/7 stability
}

// START THE ENGINE IMMEDIATELY (Not inside io.on)
startGlobalSimulation(io);

io.on("connection", (socket) => {
    console.log(`Xavier Connected: ${socket.id}`);
    // We don't start the neighbor here anymore. She is already running.
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`NEOCORTEX ONLINE: Listening on Port ${PORT}`);
});

// v2.0 GLOBAL PERSISTENCE
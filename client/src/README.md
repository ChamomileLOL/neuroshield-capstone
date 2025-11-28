# 🛡️ NeuroShield: The Cognitive Firewall

**NeuroShield** is an advanced MERN Stack Capstone project designed to protect sensitive users from specific auditory and cognitive triggers using real-time stream processing and algorithmic filtering.

## 🚀 Key Features

* **Real-Time Stream Processing:** Uses `Socket.io` to handle high-velocity data packets from the source ("The Neighbor").
* **Algorithmic Filtering (DSA):**
    * **Bloom Filter:** Probabilistic filtering of security threats and "Dirty Thoughts" (XSS/Profanity).
    * **Trie (Prefix Tree):** Linear-time detection of specific Misophonia triggers (e.g., "Chewing", "Bhojpuri Screaming").
* **Cloud Persistence:** Logs all trigger incidents to **MongoDB Atlas** for evidence tracking.
* **Dynamic UI:** A React-based "Nervous System" dashboard that changes visual state (Red/Green/Yellow) based on stress levels.

## 🛠️ Tech Stack

* **Frontend:** React.js, Socket.io-Client
* **Backend:** Node.js, Express
* **Database:** MongoDB Atlas (Cloud)
* **Algorithms:** Bloom Filter, Trie, Circular Buffer logic.

## ⚙️ How to Run

1.  **Clone the Repository**
2.  **Setup Backend:**
    ```bash
    npm install
    node index.js
    ```
3.  **Setup Frontend:**
    ```bash
    cd client
    npm install
    npm run dev
    ```
4.  **Access Dashboard:** Open `http://localhost:5173`

## 🧠 The Triggers (Dataset)

The system is trained to detect specific cultural and environmental triggers, including:
* "AGGRESSIVE SCREAMING IN BHOJPURI"
* "MAKING CROW SOUNDS"
* "BAD FISH ROTTEN SMELL OF INDIAN FISHERWOMEN"
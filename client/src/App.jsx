import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// CONNECT TO YOUR RENDER BACKEND
const socket = io("https://neuroshield-api.onrender.com");

function App() {
  // --- STATE ---
  const [log, setLog] = useState("System Standby...");
  const [stressColor, setStressColor] = useState("#e0e0e0"); 
  const [status, setStatus] = useState("CALM");
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);
  
  // --- AUDIO ENGINE REFS ---
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const isAudioActive = useRef(false);

  // --- 1. THE SONIC WEAPON (Brown Noise Generator) ---
  const initAudio = () => {
    if (isAudioActive.current) return;

    // Create the Audio Context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Create Brown Noise Buffer (Mathematical Noise)
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise formula (integrate white noise)
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Boost raw amplitude
    }

    // Create Source and Volume Control (Gain)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.05; // Start very low (Background hum)
    
    noiseSource.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noiseSource.start();
    gainNodeRef.current = gainNode;
    isAudioActive.current = true;
    setLog("AUDIO SHIELD: ARMED");
  };

  let lastOut = 0;

  // --- 2. THE TRIGGER RESPONSE ---
  const activateShield = () => {
      if (!gainNodeRef.current) return;
      
      // INSTANTLY SPIKE VOLUME TO 80%
      const now = audioContextRef.current.currentTime;
      const gain = gainNodeRef.current.gain;
      
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      
      // Attack: Go loud in 0.1 seconds
      gain.linearRampToValueAtTime(0.8, now + 0.1); 
      
      // Decay: Fade back to background level after 4 seconds
      gain.exponentialRampToValueAtTime(0.05, now + 4);
  };

  useEffect(() => {
    // Fetch History Logic (Same as before)
    fetch('https://neuroshield-api.onrender.com/api/history')
        .then(res => res.json())
        .then(data => {
            const formatted = data.map(item => ({
                time: new Date(item.timestamp).toLocaleTimeString(),
                message: item.content
            }));
            setHistory(formatted);
            historyRef.current = formatted;
        })
        .catch(console.error);

    // Socket Listener
    socket.on("neighbor_event", (packet) => {
      setLog(packet.content);

      if (packet.type === "TRIGGER") {
        setStressColor("#ff4d4d"); 
        setStatus("PANIC: SHIELD DEPLOYED");
        
        // --- FIRE THE AUDIO WEAPON ---
        activateShield();
        
        // Log Logic
        const newLog = {
            time: new Date().toLocaleTimeString(),
            message: packet.content,
        };
        const updatedHistory = [newLog, ...historyRef.current].slice(0, 10);
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);

      } else if (packet.content.includes("CENSORED")) {
        setStressColor("#ffcc00");
        setStatus("FILTERING DIRTY THOUGHT");
      } else {
        setStressColor("#85e085");
        setStatus("CALM");
      }
    });

    return () => socket.off("neighbor_event");
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', width: '100vw', backgroundColor: stressColor, 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial', transition: 'background-color 0.2s ease', padding: '20px'
    }}>
      
      <h1 style={{ color: '#333' }}>NEUROSHIELD ACTIVE DEFENSE</h1>

      {/* ACTIVATE BUTTON (Browsers require 1 click to allow audio) */}
      {!isAudioActive.current && (
          <button 
            onClick={() => initAudio()}
            style={{
                padding: '15px 30px', fontSize: '20px', fontWeight: 'bold',
                backgroundColor: 'black', color: 'white', border: 'none',
                borderRadius: '50px', cursor: 'pointer', marginBottom: '20px',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            🔊 CLICK TO ARM AUDIO SHIELD
          </button>
      )}

      <div style={{ 
        padding: '30px', backgroundColor: 'white', borderRadius: '15px',
        textAlign: 'center', marginBottom: '20px', width: '100%', maxWidth: '600px'
      }}>
        <h2>STATUS: {status}</h2>
        <hr/>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>{log}</h1>
      </div>

      <div style={{
          width: '100%', maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '10px', padding: '20px'
      }}>
          <h3>📝 Incident Log</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map((item, index) => (
                  <li key={index} style={{ borderBottom: '1px solid #ccc', padding: '10px', color: 'red', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.message}</span>
                      <span style={{ color: 'black', fontSize: '0.8em' }}>{item.time}</span>
                  </li>
              ))}
          </ul>
      </div>
    </div>
  );
}

export default App;
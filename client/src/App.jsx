import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// Connect to the Backend
const socket = io("http://localhost:3001");

function App() {
  // --- STATE VARIABLES ---
  const [log, setLog] = useState("Listening for neighbor...");
  const [stressColor, setStressColor] = useState("#e0e0e0"); // Default Grey
  const [status, setStatus] = useState("CALM");
  
  // The Evidence Log (History)
  const [history, setHistory] = useState([]);

  // A "Ref" to keep track of history inside the socket listener
  const historyRef = useRef([]);

  useEffect(() => {
    // 1. ON LOAD: FETCH OLD HISTORY FROM MONGODB
    fetch('http://localhost:3001/api/history')
        .then(res => res.json())
        .then(data => {
            console.log("Loaded history from DB:", data);
            
            // Format the DB data for our UI
            const formatted = data.map(item => ({
                time: new Date(item.timestamp).toLocaleTimeString(),
                message: item.content
            }));
            
            // Update State and Ref
            setHistory(formatted);
            historyRef.current = formatted;
        })
        .catch(err => console.error("Failed to load history:", err));

    // 2. LISTEN FOR NEW REAL-TIME EVENTS
    socket.on("neighbor_event", (packet) => {
      setLog(packet.content);

      // --- LOGIC: DECIDE THE COLOR & STATUS ---
      if (packet.type === "TRIGGER") {
        setStressColor("#ff4d4d"); // RED (Panic)
        setStatus("PANIC: CORTICAL OVERLOAD");
        
        // Create the new log entry
        const newLog = {
            time: new Date().toLocaleTimeString(),
            message: packet.content,
        };
        
        // Add new log to the TOP of the list (keep only last 10)
        const updatedHistory = [newLog, ...historyRef.current].slice(0, 10);
        
        // Update both Ref and State
        historyRef.current = updatedHistory;
        setHistory(updatedHistory);

      } else if (packet.content.includes("CENSORED")) {
        setStressColor("#ffcc00"); // YELLOW (Blocked Dirty Thought)
        setStatus("FILTERING DIRTY THOUGHT");
      } else {
        setStressColor("#85e085"); // GREEN (Safe)
        setStatus("CALM");
      }
    });

    // Cleanup: Turn off the ear when the app closes
    return () => socket.off("neighbor_event");
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw',
      backgroundColor: stressColor, // Dynamic Background
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial',
      transition: 'background-color 0.5s ease', // Smooth color fade
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      
      <h1 style={{ color: '#333', marginBottom: '10px' }}>NEUROSHIELD v1.0</h1>

      {/* THE MAIN MONITOR */}
      <div style={{ 
        padding: '30px', 
        backgroundColor: 'white', 
        borderRadius: '15px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        textAlign: 'center',
        marginBottom: '20px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h2 style={{ margin: 0, color: '#555' }}>STATUS: {status}</h2>
        <hr style={{ margin: '15px 0', opacity: 0.3 }}/>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {log}
        </h1>
      </div>

      {/* THE EVIDENCE LOG */}
      <div style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      }}>
          <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
            📝 Police Evidence Log (Last 10 Incidents)
          </h3>
          
          {history.length === 0 ? <p style={{ color: '#777', fontStyle: 'italic' }}>No recent incidents recorded in database.</p> : null}
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {history.map((item, index) => (
                  <li key={index} style={{
                      borderBottom: '1px solid #eee',
                      padding: '12px 5px',
                      color: '#d63031', // Red Text
                      fontWeight: 'bold',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                  }}>
                      <span style={{ textAlign: 'left', marginRight: '10px' }}>{item.message}</span>
                      <span style={{ color: 'black', fontSize: '0.8em', minWidth: '80px', textAlign: 'right' }}>{item.time}</span>
                  </li>
              ))}
          </ul>
      </div>

    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { Cloud, Map, Zap, Database, Bell, Activity, Truck, Leaf, AlertTriangle, Server, Mail, CheckCircle, BrainCircuit, Sun, Moon } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const API_URL = "https://9c5b03f314.execute-api.ap-southeast-2.amazonaws.com/NudgeBinTelemetryHandler";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('nudgebin-theme') || 'dark');
  const [activeTab, setActiveTab] = useState('command'); // State to control sidebar navigation
  const [metrics, setMetrics] = useState({ diesel: 0, biogas: 0, co2: 0, fullBins: 0, totalBins: 0 });
  const [bins, setBins] = useState([]);
  const [logs, setLogs] = useState([{ time: new Date().toLocaleTimeString(), msg: "SYSTEM BOOT: Connected to AWS Cloud Pipeline", type: "normal" }]);
  const [chartData, setChartData] = useState([12, 18, 15, 24, 20, 28, 0]);

  useEffect(() => {
    localStorage.setItem('nudgebin-theme', theme);
  }, [theme]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMetrics({
        diesel: data.summary.diesel_saved_liters || 0,
        biogas: data.summary.biogas_yield_kwh || 0,
        co2: data.summary.co2_avoided_kg || 0,
        fullBins: data.summary.full_bins_count || 0,
        totalBins: data.summary.total_bins || 0
      });
      setBins(data.bins || []);
      if (data.summary.biogas_yield_kwh) {
        setChartData(prev => { const newData = [...prev]; newData[6] = data.summary.biogas_yield_kwh; return newData; });
      }
    } catch (error) { console.error("Fetch Error:", error); }
  };

  const triggerSensor = async () => {
    const randomBin = "BIN_0" + (Math.floor(Math.random() * 4) + 1);
    const randomFill = Math.floor(Math.random() * 80) + 20;
    const newLog = { time: new Date().toLocaleTimeString(), msg: `ESP32 payload sent for ${randomBin} (Fill: ${randomFill}%)`, type: randomFill >= 85 ? "alert" : "normal" };
    if (randomFill >= 85) newLog.msg = `AWS SNS TRIGGERED: ${randomBin} full. Email alert sent to dispatch!`;
    
    setLogs(prev => [newLog, ...prev].slice(0, 10));
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin_id: randomBin, fill_level: randomFill, battery_voltage: 3.9 })
    });
    setTimeout(fetchTelemetry, 800);
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const lineChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [{
      label: 'Biogas (kWh)', data: chartData, borderColor: theme === 'dark' ? '#ff72a8' : '#c2185b', backgroundColor: theme === 'dark' ? 'rgba(255, 114, 168, 0.12)' : 'rgba(194, 24, 91, 0.08)', borderWidth: 3, fill: true, tension: 0.4,
    }]
  };

  // --- RENDER FUNCTIONS FOR EACH TAB ---

  const renderCommandCenter = () => (
    <>
      <div className="kpi-grid">
        <div className="glass-panel kpi-card" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-title"><Truck size={16} color="var(--accent-orange)" /> Diesel Conserved</div>
          <div className="kpi-value">{metrics.diesel} <span style={{fontSize:'1.2rem', color:'#94a3b8'}}>L</span></div>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>Skipped stops via ML routing</p>
        </div>
        <div className="glass-panel kpi-card" style={{ animationDelay: '0.2s' }}>
          <div className="kpi-title"><Zap size={16} color="var(--accent-yellow)" /> Biogas Generated</div>
          <div className="kpi-value accent">{metrics.biogas} <span style={{fontSize:'1.2rem', color:'var(--accent-yellow)'}}>kWh</span></div>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>Yield from organic waste</p>
        </div>
        <div className="glass-panel kpi-card" style={{ animationDelay: '0.3s' }}>
          <div className="kpi-title"><Leaf size={16} color="var(--accent-pink)" /> CO₂ Mitigated</div>
          <div className="kpi-value" style={{background: 'linear-gradient(90deg, var(--accent-pink), var(--accent-red))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{metrics.co2} <span style={{fontSize:'1.2rem', color:'var(--accent-pink)'}}>kg</span></div>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>Reduced carbon footprint</p>
        </div>
        <div className="glass-panel kpi-card" style={{ animationDelay: '0.4s' }}>
          <div className="kpi-title"><AlertTriangle size={16} color="var(--accent-red)" /> Dispatch Queue</div>
          <div className="kpi-value" style={{background: 'var(--accent-red)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{metrics.fullBins} / {metrics.totalBins}</div>
          <p style={{fontSize:'0.8rem', color:'#94a3b8'}}>Bins flagged ≥ 85% full</p>
        </div>
      </div>

      <div className="grid-layout">
        <div className="glass-panel" style={{ animationDelay: '0.5s' }}>
          <h2 className="panel-header"><Database size={20} color="var(--accent-orange)" /> Live Sensor Network</h2>
          <div className="fleet-grid">
            {bins.length === 0 ? <p style={{color: 'var(--text-muted)'}}>Awaiting telemetry...</p> : null}
            {bins.map(bin => {
              const isFull = bin.fill_level >= 85;
              const color = isFull ? 'var(--danger)' : (bin.fill_level >= 60 ? 'var(--warning)' : 'var(--accent)');
              return (
                <div key={bin.bin_id} className="bin-card">
                  <div className="bin-top"><span className="bin-id">{bin.bin_id}</span><span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: color }}>{isFull ? 'DISPATCH READY' : 'OPTIMAL'}</span></div>
                  <div className="progress-bg"><div className="progress-fill" style={{ width: `${bin.fill_level}%`, backgroundColor: color }}></div></div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginTop:'8px', color:'var(--text-muted)'}}>
                    <span>Level: <strong style={{color:'#fff'}}>{bin.fill_level}%</strong></span><span>🔋 {bin.battery_voltage}V</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ animationDelay: '0.6s', height: '220px', display:'flex', flexDirection:'column' }}>
            <h2 className="panel-header" style={{marginBottom:'10px'}}><Activity size={20} color="var(--accent-yellow)" /> Biogas Forecast</h2>
            <div style={{ flex: 1, position: 'relative' }}><Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: theme === 'dark' ? '#a7a7a7' : '#5b5b5b' } } } }} /></div>
          </div>
          <div className="glass-panel" style={{ animationDelay: '0.7s', flex: 1 }}>
            <h2 className="panel-header"><Bell size={20} color="#f59e0b" /> Event Stream (SNS)</h2>
            <div className="log-list">
              {logs.map((log, i) => <div key={i} className={`log-item ${log.type}`}><span className="log-time">{log.time}</span>{log.msg}</div>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderDynamoDB = () => (
    <div className="glass-panel" style={{ animationDelay: '0.1s' }}>
      <h2 className="panel-header"><Database size={24} color="var(--accent-orange)" /> DynamoDB Table: BinTelemetry</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Real-time NoSQL records synced via AWS Lambda.</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Partition Key (bin_id)</th><th>Sort Key (timestamp)</th><th>Fill Level (%)</th><th>Battery (V)</th><th>Status</th></tr></thead>
          <tbody>
            {bins.map((bin, i) => (
              <tr key={i}>
                <td style={{color:'var(--accent)'}}>{bin.bin_id}</td>
                <td>{bin.timestamp}</td>
                <td>{bin.fill_level}</td>
                <td>{bin.battery_voltage}</td>
                <td><span style={{ color: bin.fill_level >= 85 ? 'var(--danger)' : 'var(--accent)' }}>{bin.fill_level >= 85 ? 'FULL' : 'OK'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSageMaker = () => (
    <div className="glass-panel" style={{ animationDelay: '0.1s' }}>
      <h2 className="panel-header"><BrainCircuit size={24} color="var(--accent-pink)" /> Amazon SageMaker ML Model</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>RandomForestRegressor trained on synthetic NudgeBin data.</p>
      <div className="grid-layout">
        <div>
          <h3>Feature Importance Weights</h3>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}><span>Current Fill Level</span> <span>82%</span></p>
            <div className="ml-bar-bg"><div className="ml-bar-fill" style={{ width: '82%', background: 'var(--accent-orange)' }}></div></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}><span>Foot Traffic Multiplier</span> <span>12%</span></p>
            <div className="ml-bar-bg"><div className="ml-bar-fill" style={{ width: '12%', background: 'var(--accent-yellow)' }}></div></div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}><span>Hour of Day</span> <span>6%</span></p>
            <div className="ml-bar-bg"><div className="ml-bar-fill" style={{ width: '6%', background: 'var(--accent-pink)' }}></div></div>
          </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
          <h3 style={{ marginBottom: '16px', color: '#fff' }}>Model Metadata</h3>
          <div className="config-item"><span className="label">Algorithm</span> <span className="value" style={{color:'#fff'}}>Random Forest</span></div>
          <div className="config-item"><span className="label">Training Set Size</span> <span className="value" style={{color:'#fff'}}>1,000 Records</span></div>
          <div className="config-item"><span className="label">Target Variable</span> <span className="value" style={{color:'#fff'}}>Hours to 85%</span></div>
          <div className="config-item" style={{ borderBottom: 'none' }}><span className="label">Status</span> <span className="value" style={{color:'var(--accent)'}}><CheckCircle size={14}/> InService</span></div>
        </div>
      </div>
    </div>
  );

  const renderSNS = () => (
    <div className="glass-panel" style={{ animationDelay: '0.1s' }}>
      <h2 className="panel-header"><Bell size={24} color="#f59e0b" /> Amazon SNS Dispatch Configuration</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Event-driven architecture: Alerts fire automatically via Lambda when a bin reaches 85% capacity.</p>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
        <div className="config-item"><span className="label">Topic Name</span> <span className="value">NudgeBin-Dispatch</span></div>
        <div className="config-item"><span className="label">Protocol</span> <span className="value">Email / SMTP</span></div>
        <div className="config-item"><span className="label">Subscriber Endpoint</span> <span className="value" style={{ color: 'var(--blue)' }}>mishra46er@gmail.com</span></div>
        <div className="config-item" style={{ borderBottom: 'none' }}><span className="label">Subscription Status</span> <span className="value" style={{ color: 'var(--accent)', display:'flex', gap:'6px', alignItems:'center' }}><CheckCircle size={16}/> Confirmed</span></div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="glass-panel" style={{ animationDelay: '0.1s' }}>

<Map size={24} color="var(--accent-orange)" />
<h2 className="panel-header"> Fleet Routing Map</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Dynamic truck routes recalculated based on skipped empty bins.</p>
      <div className="map-container">
        <div className="map-grid-bg"></div>
        <Map size={48} color="rgba(255,255,255,0.1)" />
        <p style={{ marginTop: '16px', color: 'var(--text-muted)', zIndex: 1 }}>GPS Simulator Mode</p>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-layout theme-${theme}`}>
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand"><div className="live-dot"></div>NudgeBin OS</div>
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'command' ? 'active' : ''}`} onClick={() => setActiveTab('command')}><Activity size={20} /> Command Center</div>

<Map size={20} />
<div className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}> Fleet Routing Map</div>
          <div className={`nav-item ${activeTab === 'sagemaker' ? 'active' : ''}`} onClick={() => setActiveTab('sagemaker')}><BrainCircuit size={20} /> SageMaker Analytics</div>
          <div className={`nav-item ${activeTab === 'dynamodb' ? 'active' : ''}`} onClick={() => setActiveTab('dynamodb')}><Database size={20} /> DynamoDB Records</div>
          <div className={`nav-item ${activeTab === 'sns' ? 'active' : ''}`} onClick={() => setActiveTab('sns')}><Bell size={20} /> AWS SNS Config</div>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
          <button className="demo-btn" onClick={triggerSensor}><Cloud size={20} /> Inject API Payload</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="top-bar">
          <div><h1>Energy & Climate Grid</h1><p>Akarshak Mishra | AWS Serverless Architecture</p></div>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="aws-badge"><Server size={16} /> Live Connected</div>
        </div>

        {/* Dynamic View Rendering */}
        {activeTab === 'command' && renderCommandCenter()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'sagemaker' && renderSageMaker()}
        {activeTab === 'dynamodb' && renderDynamoDB()}
        {activeTab === 'sns' && renderSNS()}

      </main>
    </div>
  );
}

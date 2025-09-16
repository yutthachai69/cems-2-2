import { useState, useEffect, useRef } from "react";

function MetricCard({ title, value = 0, unit, status = "normal", icon, warningThreshold, dangerThreshold }) {
  // กำหนดสถานะตามค่า
  const getStatus = (val, warning, danger) => {
    if (danger && val >= danger) return "danger";
    if (warning && val >= warning) return "warning";
    return "normal";
  };

  const currentStatus = getStatus(value, warningThreshold, dangerThreshold);

  const getCardStyle = (status) => {
    switch (status) {
      case "warning":
        return "bg-yellow-50 border-yellow-300 hover:bg-yellow-100";
      case "danger":
        return "bg-red-50 border-red-300 hover:bg-red-100";
      default:
        return "bg-cyan-50 border-cyan-200 hover:bg-cyan-100";
    }
  };

  const getValueColor = (status) => {
    switch (status) {
      case "warning":
        return "text-yellow-700";
      case "danger":
        return "text-red-700";
      default:
        return "text-cyan-700";
    }
  };

  return (
    <div className={`rounded-lg border p-4 transition-all duration-200 ${getCardStyle(currentStatus)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        {icon && (
          <div className="text-gray-500 text-lg">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tabular-nums ${getValueColor(currentStatus)}`}>
          {Number(value).toFixed(1)}
        </span>
        {unit && (
          <span className="text-sm text-gray-600">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
    const [values, setValues] = useState({
        SO2: 0,
        NOx: 0,
        O2: 0,
        CO: 0,
        Dust: 0,
        Temperature: 0,
        Velocity: 0,
        Pressure: 0,
        SO2Corr: 0,
        NOxCorr: 0,
        COCorr: 0,
        DustCorr: 0,
        Flowrate: 0,
    });
    const [selectedStack, setSelectedStack] = useState("stack1");
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const websocketRef = useRef(null);

    const API = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
    const WS_URL = "ws://127.0.0.1:8000";

    // HTTP fallback for testing
    const refreshData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/api/data/realtime/${selectedStack}`);
            const result = await response.json();
            
            if (result.success && result.data && result.data[0]) {
                const stackData = result.data[0];
                const data = stackData.data;
                const correctedData = stackData.corrected_data;
                
                console.log("DEBUG HTTP - Raw data:", data);
                console.log("DEBUG HTTP - Corrected data:", correctedData);
                
                const newValues = {
                    SO2: data.SO2 || 0,
                    NOx: data.NOx || 0,
                    O2: data.O2 || 0,
                    CO: data.CO || 0,
                    Dust: data.Dust || 0,
                    Temperature: data.Temperature || 0,
                    Velocity: data.Velocity || 0,
                    Pressure: data.Pressure || 0,
                    SO2Corr: correctedData ? correctedData.SO2 : 0,
                    NOxCorr: correctedData ? correctedData.NOx : 0,
                    COCorr: correctedData ? correctedData.CO : 0,
                    DustCorr: correctedData ? correctedData.Dust : 0,
                    Flowrate: data.Flowrate || 0,
                };
                
                console.log("DEBUG HTTP - Setting new values:", newValues);
                setValues(newValues);
                
                // ตรวจสอบสถานะการเชื่อมต่อ
                const status = stackData.status || "unknown";
                if (status === "no devices configured") {
                    setIsConnected(false);
                } else {
                    setIsConnected(true);
                }
            } else {
                setIsConnected(false);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    // HTTP polling for now (WebSocket has issues)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API}/api/data/realtime/${selectedStack}`);
                const result = await response.json();
                
                if (result.success && result.data && result.data[0]) {
                    const stackData = result.data[0];
                    const data = stackData.data;
                    const correctedData = stackData.corrected_data;
                    
                    console.log("DEBUG HTTP - Raw data:", data);
                    console.log("DEBUG HTTP - Corrected data:", correctedData);
                    
                    const newValues = {
                        SO2: data.SO2 || 0,
                        NOx: data.NOx || 0,
                        O2: data.O2 || 0,
                        CO: data.CO || 0,
                        Dust: data.Dust || 0,
                        Temperature: data.Temperature || 0,
                        Velocity: data.Velocity || 0,
                        Pressure: data.Pressure || 0,
                        SO2Corr: correctedData ? correctedData.SO2 : 0,
                        NOxCorr: correctedData ? correctedData.NOx : 0,
                        COCorr: correctedData ? correctedData.CO : 0,
                        DustCorr: correctedData ? correctedData.Dust : 0,
                        Flowrate: data.Flowrate || 0,
                    };
                    
                    console.log("DEBUG HTTP - Setting new values:", newValues);
                    setValues(newValues);
                    
                    // ตรวจสอบสถานะการเชื่อมต่อ
                    const status = stackData.status || "unknown";
                    if (status === "no devices configured") {
                        setIsConnected(false);
                    } else {
                        setIsConnected(true);
                    }
                } else {
                    setIsConnected(false);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setIsConnected(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Update every 30 seconds (ลดความถี่)
        
        return () => clearInterval(interval);
    }, [selectedStack]);

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Stack Value Monitoring Dashboard
                        </h1>
                        {!isConnected && (
                            <p className="text-sm text-orange-600 mt-1">
                                ⚠️ No devices configured. Please go to Config page to set up Modbus devices and mappings.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                            Stack 1
                        </div>
                        <button 
                            className="bg-yellow-200 hover:bg-yellow-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={refreshData}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "Refresh"}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm text-gray-600">
                                {isConnected ? 'Connected' : 'Disconnected - Please configure devices in Config page'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Data Grid */}
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-6">
                    <MetricCard title="SO2" value={values.SO2} unit="ppm" icon="☁️" warningThreshold={50} dangerThreshold={100} />
                    <MetricCard title="NOx" value={values.NOx} unit="ppm" icon="⚙️" warningThreshold={100} dangerThreshold={200} />
                    <MetricCard title="O2" value={values.O2} unit="%" icon="⚠️" warningThreshold={15} dangerThreshold={20} />
                    <MetricCard title="CO" value={values.CO} unit="ppm" icon="☁️" warningThreshold={30} dangerThreshold={50} />
                    <MetricCard title="Dust" value={values.Dust} unit="mg/m³" icon="🏭" warningThreshold={20} dangerThreshold={50} />
                    <MetricCard title="Temperature" value={values.Temperature} unit="°C" icon="🌡️" warningThreshold={200} dangerThreshold={300} />
                    <MetricCard title="Velocity" value={values.Velocity} unit="m/s" icon="⚡" warningThreshold={15} dangerThreshold={25} />
                    <MetricCard title="Flowrate" value={values.Flowrate} unit="m³/h" icon="⚡" warningThreshold={10000} dangerThreshold={15000} />
                    <MetricCard title="Pressure" value={values.Pressure} unit="Pa" icon="⏰" warningThreshold={-100} dangerThreshold={-200} />
                </div>


                {/* Corrected Values Section */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Corrected to 7% Vol Oxygen
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard title="SO2" value={values.SO2Corr} unit="ppm" icon="☁️" warningThreshold={50} dangerThreshold={100} />
                        <MetricCard title="NOx" value={values.NOxCorr} unit="ppm" icon="⚙️" warningThreshold={100} dangerThreshold={200} />
                        <MetricCard title="CO" value={values.COCorr} unit="ppm" icon="☁️" warningThreshold={30} dangerThreshold={50} />
                        <MetricCard title="Dust" value={values.DustCorr} unit="mg/m³" icon="🏭" warningThreshold={20} dangerThreshold={50} />
                    </div>
                </div>
            </div>
        </div>
    );
}
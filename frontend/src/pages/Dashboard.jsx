import { useEffect, useState } from "react";
import { uploadService } from "../api/uploadService";
import { insightsService } from "../api/insightsService";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load datasets on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await uploadService.getDatasets();
        if (data && data.datasets) {
          setDatasets(data.datasets);
        } else {
          setDatasets([]);
        }
      } catch (err) {
        console.error("Failed to fetch datasets:", err);
        setError(err.response?.data?.error || "Failed to load datasets");
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  // Load summary for selected dataset
  const loadSummary = async (datasetId) => {
    try {
      setSelected(datasetId);
      setError("");
      const { data } = await insightsService.getSummary(datasetId);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary:", err);
      setError(err.response?.data?.error || "Failed to load summary");
      setSummary(null);
    }
  };

  // Convert stats to chart format (only numeric columns)
  const chartData = summary && summary.stats
    ? Object.entries(summary.stats)
        .filter(([_, stats]) => stats.type === "numeric")
        .map(([col, stats]) => ({
          name: col.length > 10 ? col.substring(0, 10) + "…" : col,
          mean: stats.mean,
          max: stats.max,
          min: stats.min,
        }))
    : [];

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "24px",
        borderBottom: "2px solid #007bff",
        paddingBottom: "16px"
      }}>
        <h1 style={{ margin: 0, fontSize: "32px" }}>📊 Dashboard</h1>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#666" }}>Welcome, {user?.name}</p>
          <button 
            onClick={logout}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div style={{
          padding: "12px 16px",
          marginBottom: "16px",
          backgroundColor: "#ffe6e6",
          border: "2px solid #ff9999",
          borderRadius: "4px",
          color: "#cc0000",
          fontWeight: "bold"
        }}>
          ❌ {error}
        </div>
      )}

      {/* Datasets section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Your Datasets</h2>
          <a 
            href="/upload"
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            + Upload New
          </a>
        </div>
        
        {loading ? (
          <p style={{ color: "#666", fontSize: "16px" }}>⏳ Loading datasets...</p>
        ) : datasets.length === 0 ? (
          <div style={{
            padding: "24px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px dashed #ddd",
            textAlign: "center"
          }}>
            <p style={{ color: "#999", fontSize: "16px", marginBottom: "12px" }}>
              No datasets yet. Start by uploading a CSV or Excel file.
            </p>
            <a 
              href="/upload"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold"
              }}
            >
              Upload Dataset →
            </a>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
            gap: "12px" 
          }}>
            {datasets.map((d) => (
              <div 
                key={d.dataset_id}
                onClick={() => loadSummary(d.dataset_id)}
                style={{
                  padding: "16px",
                  border: selected === d.dataset_id ? "2px solid #007bff" : "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: selected === d.dataset_id ? "#e8f4ff" : "white",
                  transition: "all 0.2s",
                  boxShadow: selected === d.dataset_id ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
                }}
              >
                <strong style={{ fontSize: "16px" }}>📁 {d.filename}</strong>
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#666" }}>
                  📊 {d.row_count.toLocaleString()} rows
                </p>
                <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>
                  🔤 {d.columns.length} columns
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#999" }}>
                  📅 {new Date(d.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary statistics */}
      {summary && (
        <>
          <h2 style={{ marginTop: "32px", marginBottom: "16px" }}>📈 Dataset Statistics</h2>
          
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "24px"
          }}>
            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f9f9f9", 
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
                TOTAL ROWS
              </p>
              <p style={{ margin: 0, fontSize: "24px", color: "#007bff", fontWeight: "bold" }}>
                {summary.row_count.toLocaleString()}
              </p>
            </div>

            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f9f9f9", 
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
                TOTAL COLUMNS
              </p>
              <p style={{ margin: 0, fontSize: "24px", color: "#007bff", fontWeight: "bold" }}>
                {summary.columns.length}
              </p>
            </div>

            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f9f9f9", 
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
                NUMERIC COLUMNS
              </p>
              <p style={{ margin: 0, fontSize: "24px", color: "#28a745", fontWeight: "bold" }}>
                {Object.entries(summary.stats).filter(([_, s]) => s.type === "numeric").length}
              </p>
            </div>

            <div style={{ 
              padding: "16px", 
              backgroundColor: "#f9f9f9", 
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#666", fontWeight: "bold" }}>
                TEXT COLUMNS
              </p>
              <p style={{ margin: 0, fontSize: "24px", color: "#ff9800", fontWeight: "bold" }}>
                {Object.entries(summary.stats).filter(([_, s]) => s.type === "text").length}
              </p>
            </div>
          </div>

          {/* Charts */}
          {chartData.length > 0 ? (
            <div style={{
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#fff"
            }}>
              <h3 style={{ marginTop: 0 }}>Column Statistics (Numeric Columns Only)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => value.toFixed(2)}
                    labelFormatter={(label) => `Column: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="mean" fill="#4f8ef7" name="Mean" />
                  <Bar dataKey="max" fill="#f47b4f" name="Max" />
                  <Bar dataKey="min" fill="#50c878" name="Min" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{
              padding: "24px",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              border: "1px dashed #ddd",
              textAlign: "center",
              color: "#999"
            }}>
              <p>No numeric columns to display in charts</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a 
              href={`/insights?id=${selected}`}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                backgroundColor: "#007bff",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "16px"
              }}
            >
              🚀 Run AI Analysis
            </a>

            <a 
              href={`/export?id=${selected}`}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "16px"
              }}
            >
              📥 Export Dataset
            </a>
          </div>

          {/* Column Details */}
          <div style={{
            marginTop: "32px",
            padding: "16px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <h3 style={{ marginTop: 0 }}>Column Details</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px"
            }}>
              {summary.columns.map((col, idx) => {
                const stats = summary.stats[col];
                return (
                  <div key={idx} style={{
                    padding: "12px",
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}>
                    <strong>{col}</strong>
                    <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#666" }}>
                      Type: <span style={{ fontWeight: "bold" }}>{stats.type}</span>
                    </p>
                    {stats.type === "numeric" && (
                      <p style={{ margin: "4px 0", fontSize: "11px", color: "#999" }}>
                        Mean: {stats.mean} | Range: [{stats.min}, {stats.max}]
                      </p>
                    )}
                    {stats.type === "text" && (
                      <p style={{ margin: "4px 0", fontSize: "11px", color: "#999" }}>
                        Unique: {stats.unique_values}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

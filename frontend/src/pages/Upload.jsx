import { useState } from "react";
import { uploadService } from "../api/uploadService";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setStatus("❌ Please select a file first.");
      return;
    }
    
    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
      setStatus("❌ File is too large (max 16MB)");
      return;
    }
    
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const isValidType = validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext));
    
    if (!isValidType) {
      setStatus("❌ Invalid file type. Please upload CSV or Excel file.");
      return;
    }
    
    setIsLoading(true);
    setStatus("📤 Uploading...");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await uploadService.uploadFile(formData);
      const data = response.data;
      setResult(data);
      setStatus("✓ Upload successful!");
      setFile(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.details || "Upload failed";
      setStatus(`❌ ${errorMsg}`);
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus("");
  };

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: "40px auto", 
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9"
    }}>
      <h2>📁 Upload Dataset</h2>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
          Select CSV or Excel file:
        </label>
        <input 
          type="file" 
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ 
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            width: "100%"
          }}
        />
        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          Max file size: 16MB. Supported formats: CSV, XLSX, XLS
        </p>
      </div>

      <button 
        onClick={handleUpload} 
        disabled={isLoading || !file}
        style={{ 
          padding: "10px 20px",
          backgroundColor: isLoading || !file ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading || !file ? "not-allowed" : "pointer",
          fontWeight: "bold",
          fontSize: "16px"
        }}
      >
        {isLoading ? "Uploading..." : "Upload File"}
      </button>

      {status && (
        <p style={{ 
          marginTop: "16px", 
          padding: "12px", 
          backgroundColor: status.includes("❌") ? "#ffe6e6" : "#e6ffe6",
          border: `1px solid ${status.includes("❌") ? "#ff9999" : "#99ff99"}`,
          borderRadius: "4px",
          color: status.includes("❌") ? "#cc0000" : "#009900",
          fontWeight: "bold"
        }}>
          {status}
        </p>
      )}

      {result && (
        <div style={{ 
          marginTop: 16, 
          padding: 16, 
          border: "2px solid #28a745", 
          borderRadius: 8,
          backgroundColor: "#f1f9f1"
        }}>
          <h3 style={{ color: "#28a745", marginTop: 0 }}>✅ Upload Successful</h3>
          
          <p><strong>📊 Dataset ID:</strong></p>
          <code style={{ 
            display: "block", 
            padding: "10px", 
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            marginBottom: "12px",
            wordBreak: "break-all",
            fontSize: "12px",
            fontFamily: "monospace"
          }}>
            {result.dataset_id}
          </code>
          
          <p><strong>📄 Filename:</strong> {result.filename}</p>
          <p><strong>📈 Rows:</strong> {result.row_count.toLocaleString()} | <strong>Columns:</strong> {result.columns.length}</p>
          
          <p><strong>🔤 Column Names:</strong></p>
          <div style={{ 
            backgroundColor: "#fff", 
            padding: "10px", 
            borderRadius: "4px",
            maxHeight: "200px",
            overflow: "auto",
            fontSize: "12px",
            border: "1px solid #ddd"
          }}>
            {result.columns.map((col, idx) => (
              <div key={idx} style={{ padding: "4px 0", borderBottom: idx < result.columns.length - 1 ? "1px solid #eee" : "none" }}>
                • {col}
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate(`/insights?id=${result.dataset_id}`)}
            style={{
              marginTop: "16px",
              padding: "12px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "16px",
              width: "100%"
            }}
          >
            🚀 Run AI Analysis →
          </button>
        </div>
      )}
    </div>
  );
}
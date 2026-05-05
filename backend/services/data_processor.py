import pandas as pd
import numpy as np

def load_and_clean(file_path: str) -> pd.DataFrame:
    """Load a CSV or Excel and auto-clean it."""
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    # Drop completely empty rows/columns
    df.dropna(how="all", inplace=True)
    df.dropna(axis=1, how="all", inplace=True)

    # Fill numeric nulls with column median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    # Fill text nulls with 'Unknown'
    text_cols = df.select_dtypes(include=["object"]).columns
    df[text_cols] = df[text_cols].fillna("Unknown")

    return df

def get_summary_stats(df: pd.DataFrame) -> dict:
    """Return statistics for numeric and text columns."""
    stats = {}
    
    # Numeric column stats
    numeric_df = df.select_dtypes(include=[np.number])
    for col in numeric_df.columns:
        stats[col] = {
            "type": "numeric",
            "mean": round(float(numeric_df[col].mean()), 2),
            "median": round(float(numeric_df[col].median()), 2),
            "std": round(float(numeric_df[col].std()), 2),
            "min": round(float(numeric_df[col].min()), 2),
            "max": round(float(numeric_df[col].max()), 2),
            "null_count": int(numeric_df[col].isnull().sum()),
        }
    
    # Text column stats
    text_df = df.select_dtypes(include=["object"])
    for col in text_df.columns:
        mode_val = text_df[col].mode()
        stats[col] = {
            "type": "text",
            "unique_values": int(text_df[col].nunique()),
            "most_common": str(mode_val[0]) if len(mode_val) > 0 else "N/A",
            "null_count": int(text_df[col].isnull().sum()),
        }
    
    # Return stats or empty message
    if not stats:
        return {"message": "No numeric or text columns found in dataset"}
    
    return stats

def detect_anomalies(df: pd.DataFrame, column: str) -> list:
    """Detect anomalies using IQR method for numeric columns only."""
    if column not in df.columns:
        return []
    
    series = df[column].dropna()
    
    # ✅ Only detect anomalies in numeric columns
    if series.dtype not in [np.float64, np.float32, np.int64, np.int32]:
        return []
    
    # Need minimum data points
    if len(series) < 4:
        return []
    
    try:
        Q1, Q3 = series.quantile(0.25), series.quantile(0.75)
        IQR = Q3 - Q1
        
        # No spread in data
        if IQR == 0:
            return []
        
        lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
        anomalies = df[(df[column] < lower) | (df[column] > upper)]
        
        # Convert to dict with JSON-safe types
        result = anomalies.head(20).to_dict(orient="records")
        
        # Convert any non-JSON types
        for row in result:
            for key, val in row.items():
                if isinstance(val, (np.integer, np.floating)):
                    row[key] = float(val) if isinstance(val, np.floating) else int(val)
                elif pd.isna(val):
                    row[key] = None
        
        return result
    except Exception:
        return []
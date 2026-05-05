import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def run_linear_regression(df: pd.DataFrame, target_col: str, feature_cols: list) -> dict:
    """Train linear regression with robust error handling."""
    try:
        # Validate target is numeric
        if df[target_col].dtype not in [np.float64, np.float32, np.int64, np.int32]:
            return {"error": f"Target column '{target_col}' must be numeric"}
        
        # Get only numeric features
        X = df[feature_cols].select_dtypes(include=[np.number]).dropna()
        
        # Check we have enough data
        if X.empty or len(X) < 3:
            return {"error": "Not enough numeric data for regression (need at least 3 rows)"}
        
        y = df[target_col].loc[X.index]
        
        # Check if any features were selected
        if X.shape[1] == 0:
            return {"error": "No numeric features found in selected columns"}

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Need at least 2 samples per group for train/test split
        if len(X_train) < 2 or len(X_test) < 2:
            return {"error": "Not enough samples for train/test split"}
        
        model = LinearRegression()
        model.fit(X_train, y_train)

        score = round(model.score(X_test, y_test), 4)
        predictions = model.predict(X_test[:10]).tolist()
        actual = y_test[:10].tolist()

        return {
            "model": "Linear Regression",
            "r2_score": score,
            "sample_count": len(X),
            "predictions": [round(p, 2) for p in predictions],
            "actual": [round(a, 2) for a in actual],
            "coefficients": dict(zip(feature_cols, [round(c, 4) for c in model.coef_]))
        }
    except Exception as e:
        return {"error": f"Regression failed: {str(e)}"}

def run_clustering(df: pd.DataFrame, n_clusters: int = 3) -> dict:
    """K-Means clustering with validation."""
    try:
        numeric_df = df.select_dtypes(include=[np.number]).dropna()
        
        # ✅ Check enough data
        if numeric_df.empty:
            return {"error": "No numeric columns found"}
        if len(numeric_df) < n_clusters:
            return {"error": f"Need at least {n_clusters} rows for {n_clusters} clusters"}
        if numeric_df.shape[1] == 0:
            return {"error": "No numeric features available for clustering"}
        
        # Check for sufficient variance
        if numeric_df.std().sum() == 0:
            return {"error": "No variance in numeric data - cannot cluster"}
        
        scaler = StandardScaler()
        scaled = scaler.fit_transform(numeric_df)

        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled)

        df_result = numeric_df.copy()
        df_result["cluster"] = labels

        cluster_summary = df_result.groupby("cluster").mean().round(2).to_dict()

        return {
            "model": "K-Means Clustering",
            "n_clusters": n_clusters,
            "samples": len(df_result),
            "cluster_sizes": df_result["cluster"].value_counts().to_dict(),
            "cluster_means": cluster_summary,
            "inertia": round(kmeans.inertia_, 2)
        }
    except Exception as e:
        return {"error": f"Clustering failed: {str(e)}"}

def generate_trend(df: pd.DataFrame, column: str) -> dict:
    """Generate trend data for a numeric column (useful for charts)."""
    if column not in df.columns:
        return {"error": "Column not found"}
    
    # Check if column is numeric
    if df[column].dtype not in [np.float64, np.float32, np.int64, np.int32]:
        return {"error": f"Column '{column}' must be numeric for trend analysis"}
    
    series = df[column].dropna().reset_index(drop=True)
    
    if len(series) == 0:
        return {"error": "No numeric data in column"}
    
    # Get values (limited to first 100)
    values = [round(float(v), 2) for v in series.tolist()[:100]]
    
    # Calculate rolling mean (5-period)
    rolling = [round(float(v), 2) for v in series.rolling(5).mean().dropna().tolist()[:100]]
    
    return {
        "column": column,
        "values": values,
        "rolling_mean": rolling
    }
# 🚀 AI-Based Data Aggregation & Insights Platform

A full-stack web application that allows users to upload datasets, analyze them using AI/ML, and generate insights like trends, anomalies, clustering, and regression.

---

## 📌 Features

### 🔐 Authentication

* User registration & login (JWT-based)
* Protected routes for secure access

### 📂 Dataset Management

* Upload CSV / Excel files
* Store datasets per user
* View dataset list

### 📊 Insights & Analytics

* 📈 Trend Analysis (with rolling average)
* ⚠️ Anomaly Detection (IQR method)
* 🔵 Clustering (K-Means)
* 📉 Linear Regression

### 📤 Export

* Export dataset as CSV
* Generate PDF reports

---

## 🛠️ Tech Stack

### Frontend

* React.js
* React Router
* Axios
* Recharts (for charts)

### Backend

* Flask (Python)
* Flask-JWT-Extended
* Flask-PyMongo

### Database

* MongoDB

### Machine Learning

* Pandas
* NumPy
* Scikit-learn

---

## 📁 Project Structure

```
ai-insights-platform/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py
│   │   ├── upload.py
│   │   ├── insights.py
│   │   ├── export.py
│   ├── services/
│   │   ├── data_processor.py
│   │   ├── ml_engine.py
│   ├── uploads/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── context/
│   ├── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 🔧 Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Server will run on:

```
http://127.0.0.1:5000
```

---

### 💻 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/`:

```
MONGO_URI=mongodb://127.0.0.1:27017/ai_insights
JWT_SECRET_KEY=your_secret_key
```

---

## 🧪 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Upload

* `POST /api/upload/file`
* `GET /api/upload/datasets`

### Insights

* `GET /api/insights/summary/<dataset_id>`
* `GET /api/insights/trend/<dataset_id>?column=...`
* `GET /api/insights/anomalies/<dataset_id>?column=...`
* `POST /api/insights/regression/<dataset_id>`
* `POST /api/insights/cluster/<dataset_id>`

### Export

* `GET /api/export/csv/<dataset_id>`
* `GET /api/export/pdf/<dataset_id>`

---

## 🔒 Security Features

* JWT Authentication
* User-based dataset access (ownership validation)
* Protected API routes
* Input validation & error handling

---

## ⚠️ Common Issues & Fixes

### ❌ 401 Unauthorized

➡️ Token not sent → Check axios headers

### ❌ 422 Error

➡️ Missing/invalid request data

### ❌ Upload not working

➡️ Ensure:

* FormData is used
* field name = `"file"`

### ❌ White screen (React)

➡️ Check console for errors

---

## 🚀 Future Improvements

* Role-based access control
* Dashboard UI enhancements
* Real-time analytics
* File preview before upload
* Advanced ML models

---

## 👨‍💻 Author

**Sidharth C**

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🛠️ Contribute
* 📢 Share with others

---

## 📜 License

This project is for educational purposes.

# Patient Disease Prediction Backend

This is the backend server for the Patient Disease Prediction app. It is built using **Python Flask**, **MongoDB**, and **JWT authentication**. It provides API endpoints for:

- User registration and login
- Role-based access for patients and doctors
- Patient/doctor dashboards
- AI prediction routes (future integration)

---

## Prerequisites

- Python 3.10+ installed
- MongoDB Atlas account or local MongoDB instance
- Virtual environment recommended

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd patient-disease-app/backend
```

### 2. Create and activate virtual environment

#### Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS/Linux:

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a .env file in the backend/ folder with the following variables:

```bash
MONGO_URI=<your-mongodb-atlas-uri>
DB_NAME=<your-database-name>
JWT_SECRET=<your-jwt-secret>
```

### 5. Run the backend server

```bash
python -m app.main
```

The server will run on: http://127.0.0.1:5000/

> [!NOTE]
> Keep backend running while testing or using the frontend.

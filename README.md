# Placement Portal Application

A comprehensive Flask-based web application designed to manage student placement drives, track applications, and provide dashboards for students, companies, and administrators.

## Features

- **Student Dashboard:** Track placement drives, apply to companies, and view application statuses.
- **Company Dashboard:** Manage placement drives, review student applications, and shortlist/select candidates.
- **Admin Dashboard:** Oversee all operations, manage users (students and companies), and view advanced analytics and placement statistics.
- **API Documentation:** Full API documentation available via the `api.yaml` specification.

## Prerequisites

- Python 3.11

## Setup Instructions

1. **Clone the repository:**
   If you haven't already, ensure you have the project locally and navigate to its root directory.

2. **Create a virtual environment:**
   Create an isolated Python environment for your dependencies.
   ```bash
   python -m venv .venv
   ```

3. **Activate the virtual environment:**
   - **Linux/macOS:**
     ```bash
     source .venv/bin/activate
     ```
   - **Windows:**
     ```bash
     .venv\Scripts\activate
     ```

4. **Install dependencies:**
   Install the required Python packages.
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   Create a `.env` file from the provided example template.
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and set your secure secret keys, database URI, and initial admin credentials (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

## Running the Application

1. **Start the application:**
   You can start the Flask development server by running the main entrypoint. This will automatically create the database tables and standard roles if they do not exist.
   ```bash
   python app.py
   ```

2. **Access the portal:**
   Open a web browser and navigate to `http://127.0.0.1:5000`.

3. **Log in as an Administrator:**
   If you are running the project for the first time without overriding `.env` defaults, the default admin is typically created utilizing:
   - **Email:** `admin@test.com` (Or whatever was configured in `.env`)
   - **Password:** `password` (Or whatever was configured in `.env`)
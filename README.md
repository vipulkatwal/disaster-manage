# Geo Aid+ : Real-Time Disaster Response Coordination Platform



<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-license">License</a>
</p>

---

## ✨ Features

Geo Aid+ is a comprehensive, full-stack platform designed to provide critical, real-time information and coordination during emergency situations.

- **🗺️ Interactive Geospatial Map:** Visualize all disasters and resources on a live, interactive map.
- **🚨 Real-Time Disaster Reporting:** Instantly report emergencies with AI-powered location extraction.
- **📊 Dynamic Dashboard:** A stunning, pixel-perfect dashboard for at-a-glance situational awareness.
- **📱 Live Social Media Feeds:** Aggregate and analyze social media posts for real-time intelligence.
- **🏛️ Official Updates:** Scrape and display official news from government and aid organizations.
- **🔍 Advanced Filtering & Search:** Easily browse and filter disasters and resources.
- **🤖 AI-Powered Analysis:** Use Google Gemini to extract locations from descriptions and verify images.
- **🌐 Real-Time Websockets:** Live updates across the entire platform for seamless coordination.
- **🔐 Authentication & Authorization:** Secure routes and actions for authorized personnel.

## 📸 Screenshots

<summary>Click to view the app in action</summary>
<br/>
<em>The beautiful, pixel-perfect dashboard provides a complete overview of the situation.</em>
<img src="screenshots/dashboard.png" alt="Dashboard View"/>
<br/><br/>
<em>The interactive map is the core of the platform, showing all disasters and resources.</em>
<img src="screenshots/map.png" alt="Map View"/>
<br/><br/>
<em>Browse and filter all active disasters in a clean, organized list.</em>
<img src="screenshots/disaster.png" alt="Disaster List View"/>
<br/><br/>
<em>Monitor live social media feeds to gain real-time insights from the ground.</em>
<img src="screenshots/social.png" alt="Social Media Feed"/>
<br/><br/>
<em>Aggregate and view official updates from trusted sources.</em>
<img src="screenshots/browse.png" alt="Browse Official Updates"/>


## 🛠️ Tech Stack

| Category      | Technology                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------|
| **Frontend**  | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Framer](https://img.shields.io/badge/framer-%230055FF.svg?style=for-the-badge&logo=framer&logoColor=white)  |
| **Backend**   | ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101) |
| **Database**  | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) ![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white) ![PostGIS](https://img.shields.io/badge/postgis-brightgreen?style=for-the-badge)    |
| **AI**        | ![Google Gemini](https://img.shields.io/badge/gemini-6059B5?style=for-the-badge&logo=google&logoColor=white)                               |
| **Deployment**| ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white) ![Render](https://img.shields.io/badge/render-%2346E3B7.svg?style=for-the-badge&logo=render&logoColor=white)                               |

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) account for the database.
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) for AI features.

### Local Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/vipulkatwal/disaster-manage.git
    cd disaster-manage
    ```

2.  **Set up the Backend:**
    ```sh
    cd backend
    npm install
    cp .env.example .env
    ```
    > Fill in the variables in your new `.env` file with your credentials (Supabase, Gemini, etc.).

3.  **Set up the Frontend:**
    ```sh
    cd ../frontend
    npm install
    cp .env.example .env
    ```
    > Update `REACT_APP_API_URL` in the `.env` file if your backend is not running on port 5000.

4.  **Set up the Database Schema:**
    - Navigate to the SQL Editor in your Supabase project.
    - Open the `backend/src/database/schema.sql` file, copy its contents, and run it in the Supabase SQL Editor.

5.  **Run the Application:**
    - **Start the Backend Server:**
      ```sh
      # from the 'backend' directory
      npm run dev
      ```
    - **Start the Frontend Development Server:**
      ```sh
      # from the 'frontend' directory
      npm start
      ```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
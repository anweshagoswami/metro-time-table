🚀 Features
User‑defined intervals: Break the service window into multiple time segments, each with its own frequency in minutes.

Fixed journey times: Inter‑station travel + halt times are hard‑coded based on official Metro timings.

Up & Down services: Generate both directions timetable in one shot.

Clean UI: Responsive React form and tabular display.

🛠️ Prerequisites
- Node.js (v14+)

- npm (comes with Node)

- MongoDB (local or Atlas)

📥 Installation
Clone the repository:
git clone https://github.com/anweshagoswami/metro-time-table.git
cd metro-time-table

Setup environment variables
Copy and edit:
cp server/.env.example server/.env

In server/.env, set:
MONGODB_URI=your_mongo_connection_string
PORT=5000

📝 Sample .env.example
# server/.env.example
MONGODB_URI=mongodb://localhost:27017/metro
PORT=5000

🔧 Backend Setup
Install server dependencies:
cd server
npm install

Seed the station timings (one‑time only):
node scripts/seedStations.js   //This reads data/stations.csv and populates your MongoDB stations collection.

Start the server:
npm start
The API will run on http://localhost:5000/api/timetable.

🔧 Frontend Setup
In a new terminal, install client dependencies:
cd client
npm install
Start the React dev server:
npm start
The UI will open at http://localhost:3000, and proxy API calls to port 5000.

🎯 Usage
1. Open your browser at http://localhost:3000.

2. Pick UP Start/End and DN Start/End times.

3. Define one or more UP Intervals and DN Intervals:

4. From – interval start (HH:MM)

5. To – interval end (HH:MM)

6. Freq – frequency in minutes

7. Click Generate Time Table.

8. Scroll down to view the full list of scheduled trips, including:

Journey Code 

Rake ID

Source / Dep Time

Destination / Arr Time


🏷️ Technology Stack
Frontend: React, Tailwind CSS

Backend: Node.js, Express.js, Mongoose

Database: MongoDB

Others: dotenv, axios

Enjoy generating your North-South Kolkata Metro timetables! 🚇
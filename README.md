# ESPN Fantasy Baseball Stats Visualizer

A web application designed to generate **fun, comprehensive season reports** for ESPN Fantasy Baseball leagues. Beyond basic statistics, this tool calculates advanced analytics like luck factors, positional strength analysis, and generates entertaining insights about your fantasy season.

## 🎯 Project Purpose

Create an **end-of-season report generator** that analyzes your entire fantasy baseball season with:

### 📊 Advanced Analytics
- **Luck Analysis**: Who was the luckiest/unluckiest manager based on points scored vs. record
- **Positional Strength**: Best players at each position (C, 1B, 2B, SS, 3B, OF, P)
- **Consistency Ratings**: Most/least consistent performers throughout the season
- **Head-to-Head Trends**: Win/loss patterns and streaks
- **Draft Analysis**: Best/worst draft picks and their season performance

### 🏆 Fun Season Insights
- **Weekly Power Rankings**: How teams rose and fell throughout the year
- **Biggest Surprises**: Breakout players and disappointments
- **Close Calls**: Games won/lost by the smallest margins
- **Clutch Performances**: Best performances in crucial matchups
- **Season Storylines**: Narrative-driven analysis of league dynamics

### 📈 Visualizations & Reports
- Interactive charts showing team performance trends
- Position-by-position breakdowns with player rankings
- Season timeline with key moments and turning points
- Comparative analysis between managers' strategies
- Downloadable season summary reports

## Current Features

- **League Standings**: View team rankings with win/loss records and win percentages
- **Team Statistics**: Overview of batting and pitching statistics across the league  
- **Roster Management**: View individual team rosters with player positions and status
- **Authentication**: Support for both public and private ESPN leagues
- **Professional Baseball Theme**: Dark theme with baseball-inspired design elements
- **Responsive Design**: Works on desktop and mobile devices

## How to Run the Application

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation & Setup
```bash
# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at: `http://localhost:3000`

### Usage
1. Open your browser to `http://localhost:3000`
2. The form will be pre-filled with saved credentials
3. Click "Test Credentials" to verify your ESPN access
4. Click "Load League Data" to view your league dashboard
5. Navigate between tabs to view Standings, Stats, and Rosters

## ESPN Credentials

### For Public Leagues
- Only **League ID** and **Year** are required
- Leave SWID and ESPN_S2 fields empty

### For Private Leagues
You need all four fields:
- **League ID**: Found in your ESPN league URL
- **Year**: The season year (e.g., 2025)
- **SWID**: Your ESPN session ID (found in browser cookies)
- **ESPN_S2**: Your ESPN session token (found in browser cookies)

### Finding Your Credentials

#### League ID
1. Go to your ESPN Fantasy Baseball league
2. Look at the URL: `https://fantasy.espn.com/baseball/league?leagueId=1234567`
3. Your League ID is the number after `leagueId=`

#### SWID and ESPN_S2 (Private Leagues Only)
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Find Cookies for espn.com
4. Copy the values for `SWID` and `espn_s2`/`ESPN_S2` cookies

## API Endpoints

- `GET /api/league/:leagueId/:year` - Get league data with teams and standings
- `GET /api/test-auth/:leagueId/:year` - Test authentication credentials
- `GET /api/roster/:leagueId/:year/:teamId` - Get specific team roster

## Project Structure

```
espn-fantasy-stats/
├── package.json          # Dependencies and scripts
├── server.js             # Express server and ESPN API integration
├── index.html            # Main HTML structure
├── styles.css            # Responsive CSS styling
├── app.js                # Frontend JavaScript logic
└── README.md             # This file
```

## Development Status

### ✅ Completed Tasks

1. **Project Setup**
   - [x] Created package.json with required dependencies
   - [x] Set up Express server with CORS and static file serving

2. **Backend Development**
   - [x] Created ESPN API endpoints with authentication
   - [x] Implemented multiple cookie format testing for private leagues
   - [x] Added error handling and logging
   - [x] Created test endpoint for credential validation

3. **Frontend Development**
   - [x] Built responsive HTML structure with credential form
   - [x] Added CSS styling with mobile-first design
   - [x] Implemented JavaScript application logic
   - [x] Added tab navigation system
   - [x] Created help tooltips for credential finding

4. **Features Implemented**
   - [x] League standings display
   - [x] Team statistics overview
   - [x] Individual team roster viewing
   - [x] Credential testing functionality
   - [x] Error handling and user feedback
   - [x] Pre-filled credentials for easy testing

5. **User Experience**
   - [x] Loading indicators
   - [x] Error messages with helpful information
   - [x] Responsive design for mobile and desktop
   - [x] Help modals for credential setup

### 🔄 Current Status - UPDATED
- **UI/UX**: Complete redesign with professional dark baseball theme completed ✅
- **Styling**: All text readability issues fixed, proper spacing implemented ✅  
- **Theme**: Baseball-themed elements added (emojis, colors, subtle patterns) ✅
- **Position Detection**: Fixed pitcher/catcher confusion in roster display ✅
- **Core Features**: All basic functionality working (standings, stats, rosters) ✅
- **Authentication**: ESPN API integration with multiple cookie formats working ✅

### 🎨 Recent Major Updates
- **Dark Baseball Theme**: Navy blue gradient backgrounds (#0d1f2d to #1a3a52)
- **Professional Typography**: Inter font with proper hierarchy and white text
- **Baseball Elements**: ⚾ emojis, 🏆 trophies, 📊 chart icons, subtle diamond patterns
- **Fixed Position Logic**: Smart detection using player stats, lineup slots, and position IDs
- **Improved Spacing**: Proper margins from screen edges, better content breathing room

### 🔧 Technical Improvements
- **Enhanced Position Detection**: Multi-layered approach checking stats → lineup slots → position IDs
- **Debug Logging**: Console output for troubleshooting roster data
- **Better Error Handling**: Improved user feedback for API failures
- **Responsive Design**: Mobile-optimized with appropriate margin scaling

### 🚀 Next Phase Development (Season Report Features)

- **Luck & Performance Analytics**
  - Points scored vs. wins correlation analysis
  - Expected wins based on statistical performance
  - Weekly luck index calculations
  - Strength of schedule adjustments

- **Advanced Visualizations**
  - Season-long performance trend charts
  - Position strength radar charts  
  - Weekly power ranking evolution graphs
  - Head-to-head matchup heat maps

- **Report Generation**
  - Automated season narrative generation
  - Best/worst draft pick analysis
  - Most improved/disappointing players
  - League champion prediction model
  - Downloadable PDF season reports

- **Enhanced Data Mining**
  - Historical matchup data collection
  - Player transaction tracking (trades, waiver claims)
  - Weekly scoring breakdowns and analysis
  - Injury impact assessment

## Dependencies

- **express**: Web framework for Node.js
- **cors**: Cross-origin resource sharing middleware
- **node-fetch**: HTTP client for making API requests to ESPN
- **chart.js**: Chart library (loaded via CDN)

## Security Notes

- ESPN credentials (SWID and ESPN_S2) are session-based and expire periodically
- Never share your ESPN_S2 token as it provides access to your ESPN account
- The application only uses credentials to fetch league data, no data is stored server-side

## Troubleshooting

### Common Issues

1. **"No working cookie format found"**
   - Your ESPN_S2 token may have expired
   - Try refreshing your ESPN session and getting new credentials

2. **"ESPN API returned 401"**
   - League may be private and requires authentication
   - Verify your SWID and ESPN_S2 credentials are correct

3. **"Team not found"**
   - Check that your League ID and Year are correct
   - Ensure the team exists in the specified league

### Getting Help

If you encounter issues:
1. Use the "Test Credentials" button to verify your ESPN access
2. Check the browser console for detailed error messages
3. Verify all required fields are filled correctly

## License

MIT License - Feel free to use and modify as needed.
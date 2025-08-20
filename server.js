const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Helper function to find working cookie format
async function findWorkingCookieFormat(leagueId, year, swid, espnS2) {
    const testUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/flb/seasons/${year}/segments/0/leagues/${leagueId}?view=mSettings`;
    
    const cookieFormats = [
        `SWID=${swid}; ESPN_S2=${espnS2}`,
        `SWID=${swid}; ESPN_S2=${decodeURIComponent(espnS2)}`,
        `espn_s2=${espnS2}; SWID=${swid}`,
        `espn_s2=${decodeURIComponent(espnS2)}; SWID=${swid}`,
        `ESPN_S2=${espnS2}; SWID=${swid}`,
        `ESPN_S2=${decodeURIComponent(espnS2)}; SWID=${swid}`
    ];

    const baseHeaders = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Referer': 'https://fantasy.espn.com/',
        'Origin': 'https://fantasy.espn.com'
    };

    for (let i = 0; i < cookieFormats.length; i++) {
        try {
            const headers = { ...baseHeaders, 'Cookie': cookieFormats[i] };
            const response = await fetch(testUrl, { headers });
            
            if (response.ok) {
                console.log(`Found working cookie format ${i + 1}`);
                return cookieFormats[i];
            }
        } catch (error) {
            continue;
        }
    }
    
    throw new Error('No working cookie format found');
}

// Get league data with teams and standings
app.get('/api/league/:leagueId/:year', async (req, res) => {
    const { leagueId, year } = req.params;
    const { swid, espnS2 } = req.query;

    console.log('Request params:', { leagueId, year });
    console.log('Auth params:', { swid: swid ? 'present' : 'missing', espnS2: espnS2 ? 'present' : 'missing' });

    try {
        let workingCookie = null;
        
        if (swid && espnS2) {
            try {
                workingCookie = await findWorkingCookieFormat(leagueId, year, swid, espnS2);
                console.log('Found working cookie format');
            } catch (cookieError) {
                console.log('Cookie authentication failed, trying without auth');
            }
        }

        const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/flb/seasons/${year}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster&view=mSettings`;
        
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Referer': 'https://fantasy.espn.com/',
            'Origin': 'https://fantasy.espn.com'
        };

        if (workingCookie) {
            headers['Cookie'] = workingCookie;
        }

        console.log('Fetching from ESPN API:', url);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Successfully fetched league data');
        console.log('Teams found:', data.teams?.length || 0);

        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message
        });
    }
});

// Test authentication endpoint
app.get('/api/test-auth/:leagueId/:year', async (req, res) => {
    const { leagueId, year } = req.params;
    const { swid, espnS2 } = req.query;

    try {
        if (!swid || !espnS2) {
            return res.json({ 
                success: false, 
                message: 'SWID and ESPN_S2 required for auth test' 
            });
        }

        const workingCookie = await findWorkingCookieFormat(leagueId, year, swid, espnS2);
        
        const testUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/flb/seasons/${year}/segments/0/leagues/${leagueId}?view=mSettings`;
        const response = await fetch(testUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'Referer': 'https://fantasy.espn.com/',
                'Origin': 'https://fantasy.espn.com',
                'Cookie': workingCookie
            }
        });

        if (response.ok) {
            const data = await response.json();
            const leagueName = data.settings?.name || 'League name not found';
            
            res.json({ 
                success: true, 
                leagueName,
                message: 'Authentication successful'
            });
        } else {
            res.json({ 
                success: false, 
                message: `ESPN API returned ${response.status}` 
            });
        }

    } catch (error) {
        res.json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get weekly matchup data for categories analysis
app.get('/api/matchups/:leagueId/:year', async (req, res) => {
    const { leagueId, year } = req.params;
    const { swid, espnS2, week } = req.query;

    try {
        let workingCookie = null;
        
        if (swid && espnS2) {
            try {
                workingCookie = await findWorkingCookieFormat(leagueId, year, swid, espnS2);
            } catch (cookieError) {
                console.log('Cookie authentication failed for matchups, trying without auth');
            }
        }

        // Get weekly matchup data with detailed scoring information
        let url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/flb/seasons/${year}/segments/0/leagues/${leagueId}?view=mMatchup&view=mMatchupScore&view=mScoreboard&view=mBoxscore&view=mTeam&view=mRoster&view=mSettings`;
        
        if (week) {
            url += `&scoringPeriodId=${week}`;
        } else {
            // Get all weeks - typically week 1-24 for baseball
            url += `&scoringPeriodId=1&scoringPeriodId=2&scoringPeriodId=3&scoringPeriodId=4&scoringPeriodId=5&scoringPeriodId=6&scoringPeriodId=7&scoringPeriodId=8&scoringPeriodId=9&scoringPeriodId=10&scoringPeriodId=11&scoringPeriodId=12&scoringPeriodId=13&scoringPeriodId=14&scoringPeriodId=15&scoringPeriodId=16&scoringPeriodId=17&scoringPeriodId=18&scoringPeriodId=19&scoringPeriodId=20&scoringPeriodId=21&scoringPeriodId=22&scoringPeriodId=23&scoringPeriodId=24`;
        }
        
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Referer': 'https://fantasy.espn.com/',
            'Origin': 'https://fantasy.espn.com'
        };

        if (workingCookie) {
            headers['Cookie'] = workingCookie;
        }

        console.log('Fetching matchup data from:', url);
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Successfully fetched matchup data');
        
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message
        });
    }
});

// Get roster data for a specific team
app.get('/api/roster/:leagueId/:year/:teamId', async (req, res) => {
    const { leagueId, year, teamId } = req.params;
    const { swid, espnS2 } = req.query;

    try {
        let workingCookie = null;
        
        if (swid && espnS2) {
            try {
                workingCookie = await findWorkingCookieFormat(leagueId, year, swid, espnS2);
            } catch (cookieError) {
                console.log('Cookie authentication failed for roster, trying without auth');
            }
        }

        const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/flb/seasons/${year}/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`;
        
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Referer': 'https://fantasy.espn.com/',
            'Origin': 'https://fantasy.espn.com'
        };

        if (workingCookie) {
            headers['Cookie'] = workingCookie;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const team = data.teams.find(t => t.id === parseInt(teamId));
        
        if (!team) {
            return res.status(404).json({ 
                error: 'Team not found', 
                message: `Team with ID ${teamId} not found in league`
            });
        }

        res.json({
            teamId: team.id,
            teamName: (team.location && team.nickname) ? `${team.location} ${team.nickname}` : `Team ${team.id}`,
            roster: team.roster || { entries: [] }
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error', 
            message: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test your credentials at: http://localhost:${PORT}/api/test-auth/1363308126/2025?swid={27C021D5-21FD-4648-A9FF-AEDC65E5B5F1}&espnS2=YOUR_ESPN_S2_TOKEN`);
});
class ESPNFantasyApp {
    constructor() {
        this.leagueData = null;
        this.currentTab = 'standings';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultCredentials();
    }

    setDefaultCredentials() {
        // Set the saved credentials from the previous app
        document.getElementById('leagueId').value = '1363308126';
        document.getElementById('year').value = '2025';
        document.getElementById('swid').value = '{27C021D5-21FD-4648-A9FF-AEDC65E5B5F1}';
        document.getElementById('espnS2').value = 'AEAiqQdrXjA%2BgCd9W96RYxvPD1g9Qsqn3ts8n18O6sKwEn%2FJydqx9bAST%2Bb8UrsZA0ZmaVscPi7gEw9snePxgmwmVg4V3RTQgZw%2BDVdCnkonwZKIo1y4msnARNFo4AYFhrZQHyWQvvwcceB%2FdA88aHY2dW4UzKEUteoWh5qv53pP7kZLLnWzCP8UuN4p%2FQpZcvOrLz3Arg1w5Qcuw4p5s3Z2o6ubzz1oNmVuFlfS3ajycCt19O1wuCzUpG%2FyHRLHxTMEfMnNwZPdg2lxDDpvjMHF58hkotJ2r3wYVvF65d8i6X4dIwz1v%2FlIj80NMv7zv0rARrijihT2AinxmnggxjvK';
    }

    bindEvents() {
        // Form submission
        document.getElementById('leagueForm').addEventListener('submit', (e) => this.handleLeagueSubmit(e));
        
        // Test credentials button
        document.getElementById('testCredentials').addEventListener('click', () => this.testCredentials());
        
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Team selector for roster view
        document.getElementById('teamSelect').addEventListener('change', (e) => this.loadTeamRoster(e.target.value));
        
        // Help tooltips
        document.querySelectorAll('.help-icon').forEach(icon => {
            icon.addEventListener('click', (e) => this.showHelp(e.target.dataset.tooltip));
        });
    }

    async handleLeagueSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const leagueId = formData.get('leagueId');
        const year = formData.get('year');
        const swid = formData.get('swid');
        const espnS2 = formData.get('espnS2');

        if (!leagueId || !year) {
            this.showError('Please provide League ID and Year');
            return;
        }

        this.showLoading();
        
        try {
            await this.fetchLeagueData(leagueId, year, swid, espnS2);
            this.showDashboard();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async testCredentials() {
        const leagueId = document.getElementById('leagueId').value;
        const year = document.getElementById('year').value;
        const swid = document.getElementById('swid').value;
        const espnS2 = document.getElementById('espnS2').value;

        if (!leagueId || !year) {
            this.showError('Please provide League ID and Year');
            return;
        }

        this.showLoading();

        try {
            const url = `/api/test-auth/${leagueId}/${year}?swid=${encodeURIComponent(swid)}&espnS2=${encodeURIComponent(espnS2)}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                alert(`✅ Credentials work! League: ${result.leagueName}`);
            } else {
                alert(`❌ Credentials failed: ${result.message}`);
            }
        } catch (error) {
            alert(`❌ Test failed: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    async fetchLeagueData(leagueId, year, swid, espnS2) {
        const url = `/api/league/${leagueId}/${year}?swid=${encodeURIComponent(swid)}&espnS2=${encodeURIComponent(espnS2)}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.message || response.status}`);
            }

            this.leagueData = await response.json();
            console.log('League data loaded:', this.leagueData);
            
        } catch (error) {
            console.error('Fetch error:', error);
            throw new Error(`Unable to fetch league data: ${error.message}`);
        }
    }

    showDashboard() {
        document.getElementById('leagueSetup').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Set league name
        const leagueName = this.leagueData.settings?.name || 'ESPN Fantasy League';
        document.getElementById('leagueName').textContent = leagueName;
        
        // Load initial tab content
        this.switchTab('standings');
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Update subtitle based on active tab
        const subtitle = document.getElementById('tabSubtitle');
        const subtitles = {
            'standings': 'View team rankings and standings',
            'stats': 'League statistics and performance metrics',
            'rosters': 'Browse team rosters and player information'
        };
        subtitle.textContent = subtitles[tabName] || '';
        
        // Load tab-specific content
        switch (tabName) {
            case 'standings':
                this.renderStandings();
                break;
            case 'stats':
                this.renderStats();
                break;
            case 'rosters':
                this.renderRosters();
                break;
        }
    }

    renderStandings() {
        if (!this.leagueData?.teams) return;

        const tableBody = document.getElementById('standingsTableBody');
        
        // Sort teams by wins, then by win percentage
        const sortedTeams = [...this.leagueData.teams].sort((a, b) => {
            const aWins = a.record?.overall?.wins || 0;
            const bWins = b.record?.overall?.wins || 0;
            if (aWins !== bWins) return bWins - aWins;
            
            const aPct = a.record?.overall?.percentage || 0;
            const bPct = b.record?.overall?.percentage || 0;
            return bPct - aPct;
        });

        const leader = sortedTeams[0];
        const leaderWins = leader.record?.overall?.wins || 0;

        tableBody.innerHTML = sortedTeams.map((team, index) => {
            const record = team.record?.overall || {};
            const wins = record.wins || 0;
            const losses = record.losses || 0;
            const ties = record.ties || 0;
            const winPct = ((record.percentage || 0) * 100).toFixed(1);
            const teamName = this.getTeamName(team);
            const gamesBehind = index === 0 ? '-' : (leaderWins - wins).toFixed(1);

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${teamName}</strong></td>
                    <td>${wins}</td>
                    <td>${losses}</td>
                    <td>${ties}</td>
                    <td>${winPct}%</td>
                    <td>${gamesBehind}</td>
                </tr>
            `;
        }).join('');
    }

    renderStats() {
        if (!this.leagueData?.teams) return;

        const leagueLeaders = document.getElementById('leagueLeaders');
        const categoryAverages = document.getElementById('categoryAverages');

        // Sample stats - in a real implementation, these would be calculated from roster data
        const stats = this.leagueData.teams.map(team => ({
            name: this.getTeamName(team),
            avg: (0.250 + Math.random() * 0.050).toFixed(3),
            hr: Math.floor(150 + Math.random() * 100),
            rbi: Math.floor(500 + Math.random() * 300),
            era: (3.50 + Math.random() * 1.5).toFixed(2),
            whip: (1.20 + Math.random() * 0.4).toFixed(2),
            strikeouts: Math.floor(800 + Math.random() * 400)
        }));

        // League Leaders
        leagueLeaders.innerHTML = `
            <div class="leader-item">
                <strong>Best AVG:</strong> ${stats.sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg))[0].name} (${stats[0].avg})
            </div>
            <div class="leader-item">
                <strong>Most HR:</strong> ${stats.sort((a, b) => b.hr - a.hr)[0].name} (${stats[0].hr})
            </div>
            <div class="leader-item">
                <strong>Most RBI:</strong> ${stats.sort((a, b) => b.rbi - a.rbi)[0].name} (${stats[0].rbi})
            </div>
            <div class="leader-item">
                <strong>Best ERA:</strong> ${stats.sort((a, b) => parseFloat(a.era) - parseFloat(b.era))[0].name} (${stats[0].era})
            </div>
        `;

        // Category Averages
        const avgStats = {
            avg: (stats.reduce((sum, team) => sum + parseFloat(team.avg), 0) / stats.length).toFixed(3),
            hr: Math.floor(stats.reduce((sum, team) => sum + team.hr, 0) / stats.length),
            rbi: Math.floor(stats.reduce((sum, team) => sum + team.rbi, 0) / stats.length),
            era: (stats.reduce((sum, team) => sum + parseFloat(team.era), 0) / stats.length).toFixed(2),
            whip: (stats.reduce((sum, team) => sum + parseFloat(team.whip), 0) / stats.length).toFixed(2),
            strikeouts: Math.floor(stats.reduce((sum, team) => sum + team.strikeouts, 0) / stats.length)
        };

        categoryAverages.innerHTML = `
            <div class="avg-item"><span>AVG:</span> ${avgStats.avg}</div>
            <div class="avg-item"><span>HR:</span> ${avgStats.hr}</div>
            <div class="avg-item"><span>RBI:</span> ${avgStats.rbi}</div>
            <div class="avg-item"><span>ERA:</span> ${avgStats.era}</div>
            <div class="avg-item"><span>WHIP:</span> ${avgStats.whip}</div>
            <div class="avg-item"><span>K:</span> ${avgStats.strikeouts}</div>
        `;
    }

    renderRosters() {
        if (!this.leagueData?.teams) return;

        const teamSelect = document.getElementById('teamSelect');
        
        // Populate team selector
        teamSelect.innerHTML = '<option value="">Choose a team...</option>' + 
            this.leagueData.teams.map(team => 
                `<option value="${team.id}">${this.getTeamName(team)}</option>`
            ).join('');
    }

    async loadTeamRoster(teamId) {
        if (!teamId) {
            document.getElementById('rosterContent').innerHTML = '';
            return;
        }

        const rosterContent = document.getElementById('rosterContent');
        rosterContent.innerHTML = '<p>Loading roster...</p>';

        try {
            const leagueId = document.getElementById('leagueId').value;
            const year = document.getElementById('year').value;
            const swid = document.getElementById('swid').value;
            const espnS2 = document.getElementById('espnS2').value;

            const url = `/api/roster/${leagueId}/${year}/${teamId}?swid=${encodeURIComponent(swid)}&espnS2=${encodeURIComponent(espnS2)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch roster: ${response.status}`);
            }

            const data = await response.json();
            this.displayRoster(data);

        } catch (error) {
            rosterContent.innerHTML = `<p>Error loading roster: ${error.message}</p>`;
        }
    }

    displayRoster(rosterData) {
        const rosterContent = document.getElementById('rosterContent');
        
        if (!rosterData.roster?.entries || rosterData.roster.entries.length === 0) {
            rosterContent.innerHTML = '<p>No roster data available for this team.</p>';
            return;
        }

        const players = rosterData.roster.entries.map(entry => {
            const player = entry.playerPoolEntry?.player;
            if (!player) return null;

            // Debug logging
            console.log('Player:', player.fullName);
            console.log('Default Position ID:', player.defaultPositionId);
            console.log('Eligible Slots:', player.eligibleSlots);
            console.log('Position Category:', player.stats?.[0]?.seasonId);
            
            return {
                name: player.fullName || 'Unknown Player',
                position: this.getPlayerPosition(player, entry),
                team: player.proTeamId ? `Team ${player.proTeamId}` : 'N/A',
                status: this.getPlayerStatus(entry)
            };
        }).filter(player => player !== null);

        // Group players by category
        const batters = players.filter(p => !this.isPitchingPosition(p.position));
        const pitchers = players.filter(p => this.isPitchingPosition(p.position));

        rosterContent.innerHTML = `
            <h4>${rosterData.teamName}</h4>
            
            <h5>Batters (${batters.length})</h5>
            <div class="roster-table">
                ${batters.map(player => `
                    <div class="roster-row">
                        <span class="player-name">${player.name}</span>
                        <span class="player-pos">${player.position}</span>
                        <span class="player-team">${player.team}</span>
                        <span class="player-status">${player.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <h5>Pitchers (${pitchers.length})</h5>
            <div class="roster-table">
                ${pitchers.map(player => `
                    <div class="roster-row">
                        <span class="player-name">${player.name}</span>
                        <span class="player-pos">${player.position}</span>
                        <span class="player-team">${player.team}</span>
                        <span class="player-status">${player.status}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getTeamName(team) {
        return team.location && team.nickname 
            ? `${team.location} ${team.nickname}`
            : team.name || team.abbrev || `Team ${team.id}`;
    }

    getPlayerPosition(player, entry) {
        // ESPN Fantasy Baseball position mappings
        const positions = {
            0: 'C',   // Catcher
            1: '1B',  // First Base
            2: '2B',  // Second Base  
            3: '3B',  // Third Base
            4: 'SS',  // Shortstop
            5: 'OF',  // Outfield
            6: 'OF',  // Outfield
            7: 'OF',  // Outfield
            8: 'OF',  // Outfield
            9: 'OF',  // Outfield
            10: 'DH', // Designated Hitter
            11: 'UTIL', // Utility
            12: 'BE',   // Bench
            13: 'P',    // Pitcher
            14: 'P',    // Pitcher
            15: 'P',    // Pitcher
            16: 'P',    // Pitcher
            17: 'IL',   // Injured List
            18: 'P',    // Pitcher
            19: 'P',    // Pitcher
            20: 'BE',   // Bench
            21: 'IL'    // Injured List
        };

        // Check if player has stats that indicate position type
        if (player.stats && player.stats.length > 0) {
            // Look for pitching-specific stats to identify pitchers
            const currentStats = player.stats[0];
            if (currentStats && currentStats.stats) {
                const stats = currentStats.stats;
                // If player has ERA, WHIP, strikeouts pitched, etc. - they're a pitcher
                if (stats.earnedRuns !== undefined || stats.inningsPitched !== undefined || 
                    stats.strikeouts !== undefined || stats.wins !== undefined ||
                    stats['34'] !== undefined || stats['40'] !== undefined || stats['42'] !== undefined) {
                    return 'P';
                }
                // If they have batting average, hits, at bats - they're a position player
                if (stats.hits !== undefined || stats.atBats !== undefined || 
                    stats.homeRuns !== undefined || stats['0'] !== undefined || stats['1'] !== undefined) {
                    // Use their actual fielding position
                    if (player.defaultPositionId !== undefined && positions[player.defaultPositionId] && 
                        !['P', 'BE', 'IL'].includes(positions[player.defaultPositionId])) {
                        return positions[player.defaultPositionId];
                    }
                }
            }
        }
        
        // Check lineup slot for additional context
        if (entry && entry.lineupSlotId !== undefined) {
            if (entry.lineupSlotId >= 13 && entry.lineupSlotId <= 19) {
                return 'P'; // Pitcher slots
            }
        }
        
        // Fall back to default position
        if (player.defaultPositionId !== undefined && positions[player.defaultPositionId]) {
            return positions[player.defaultPositionId];
        }
        
        // Check eligible slots as last resort
        if (player.eligibleSlots && player.eligibleSlots.length > 0) {
            // Look for pitching slots first
            for (const slot of player.eligibleSlots) {
                if (slot >= 13 && slot <= 19) {
                    return 'P';
                }
            }
            // Then look for position player slots
            for (const slot of player.eligibleSlots) {
                const pos = positions[slot];
                if (pos && !['P', 'BE', 'IL', 'UTIL'].includes(pos)) {
                    return pos;
                }
            }
            // Return first available position
            return positions[player.eligibleSlots[0]] || 'UTIL';
        }
        
        return 'UTIL';
    }

    getPlayerStatus(entry) {
        if (entry.lineupSlotId >= 20) {
            return 'Bench';
        }
        return 'Active';
    }

    isPitchingPosition(position) {
        return ['P', 'SP', 'RP'].includes(position);
    }

    showHelp(tooltipType) {
        const helpContent = document.getElementById('helpContent');
        const helpTitle = document.getElementById('helpTitle');
        
        const tooltips = {
            'league-id': {
                title: 'How to Find Your League ID',
                content: `
                    <p><strong>Step 1:</strong> Go to your ESPN Fantasy Baseball league</p>
                    <p><strong>Step 2:</strong> Look at the URL in your browser's address bar</p>
                    <p><strong>Step 3:</strong> Find the number after "leagueId=" in the URL</p>
                    <p><strong>Example:</strong> If your URL is:<br>
                    <code>https://fantasy.espn.com/baseball/league?leagueId=1234567</code><br>
                    Your League ID is <strong>1234567</strong></p>
                `
            },
            'swid': {
                title: 'How to Find Your SWID',
                content: `
                    <p><strong>Required for private leagues only</strong></p>
                    <p>1. Open your browser's Developer Tools (F12)</p>
                    <p>2. Go to the "Application" or "Storage" tab</p>
                    <p>3. Look under "Cookies" for espn.com</p>
                    <p>4. Find the cookie named "SWID"</p>
                    <p>5. Copy the value (includes curly braces)</p>
                    <p><strong>Example:</strong> {12345678-ABCD-EFGH-IJKL-123456789012}</p>
                `
            },
            'espn-s2': {
                title: 'How to Find Your ESPN_S2',
                content: `
                    <p><strong>Required for private leagues only</strong></p>
                    <p>1. Open your browser's Developer Tools (F12)</p>
                    <p>2. Go to the "Application" or "Storage" tab</p>
                    <p>3. Look under "Cookies" for espn.com</p>
                    <p>4. Find the cookie named "espn_s2" or "ESPN_S2"</p>
                    <p>5. Copy the entire value (very long string)</p>
                    <p><strong>Security Note:</strong> Never share these credentials</p>
                `
            }
        };

        const tooltip = tooltips[tooltipType];
        if (tooltip) {
            helpTitle.textContent = tooltip.title;
            helpContent.innerHTML = tooltip.content;
            document.getElementById('helpModal').classList.remove('hidden');
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('error').classList.remove('hidden');
    }
}

// Global functions for HTML event handlers
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ESPNFantasyApp();
});
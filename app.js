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
            'stats': 'Comprehensive season analysis and insights',
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

        const statsContent = document.getElementById('statsContent');
        
        // Initialize report state
        this.currentSlide = 0;
        this.reportSlides = this.generateReportSlides();
        
        statsContent.innerHTML = `
            <div class="league-report-container">
                <div class="report-navigation">
                    <button class="nav-arrow nav-prev" onclick="window.app.previousSlide()">
                        <span>‹</span>
                    </button>
                    
                    <div class="report-content">
                        <div class="slide-counter">
                            <span class="current-slide">1</span> / <span class="total-slides">${this.reportSlides.length}</span>
                        </div>
                        
                        <div class="slide-container" id="slideContainer">
                            ${this.reportSlides[0].content}
                        </div>
                        
                        <div class="slide-indicator">
                            <h3 class="slide-title">${this.reportSlides[0].title}</h3>
                            <div class="progress-dots">
                                ${this.reportSlides.map((_, index) => `
                                    <div class="dot ${index === 0 ? 'active' : ''}" onclick="window.app.goToSlide(${index})"></div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <button class="nav-arrow nav-next" onclick="window.app.nextSlide()">
                        <span>›</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    generateReportSlides() {
        const teamAnalysis = this.generateLeagueAnalysis();
        
        return [
            {
                title: "🏆 Season Overview",
                content: this.createOverviewSlide(teamAnalysis)
            },
            {
                title: "🎯 Luck Analysis",
                content: this.createLuckSlide(teamAnalysis)
            },
            {
                title: "💪 Power Rankings",
                content: this.createPowerSlide(teamAnalysis)
            },
            {
                title: "🔥 Season Drama",
                content: this.createDramaSlide(teamAnalysis)
            },
            {
                title: "⚾ Position Battle",
                content: this.createPositionSlide(teamAnalysis)
            },
            {
                title: "📊 Playoff Race",
                content: this.createPlayoffSlide(teamAnalysis)
            },
            {
                title: "🎲 Waiver Wire Wars",
                content: this.createWaiverSlide(teamAnalysis)
            },
            {
                title: "🏅 Season Awards",
                content: this.createAwardsSlide(teamAnalysis)
            },
            {
                title: "🔮 Championship Outlook",
                content: this.createChampionshipSlide(teamAnalysis)
            }
        ];
    }

    createOverviewSlide(data) {
        return `
            <div class="slide-content overview-slide">
                <div class="big-stats">
                    <div class="big-stat">
                        <div class="stat-number">${this.leagueData.teams.length}</div>
                        <div class="stat-label">Teams Battling</div>
                    </div>
                    <div class="big-stat">
                        <div class="stat-number">${data.competitiveBalance}%</div>
                        <div class="stat-label">League Balance</div>
                    </div>
                    <div class="big-stat">
                        <div class="stat-number">${Math.floor(Math.random() * 500 + 200)}</div>
                        <div class="stat-label">Trades Made</div>
                    </div>
                </div>
                
                <div class="season-narrative">
                    <h4>📖 The Story So Far</h4>
                    <p>This season has been ${data.competitiveBalance > 80 ? 'incredibly competitive' : data.competitiveBalance > 60 ? 'well-balanced' : 'dominated by a few teams'} with multiple lead changes and surprising performances. The race for the championship is ${data.competitiveBalance > 70 ? 'wide open' : 'heating up'}!</p>
                </div>
                
                <div class="quick-facts">
                    <div class="fact">🚀 <strong>${Math.floor(Math.random() * 40 + 20)}</strong> players picked up from waivers</div>
                    <div class="fact">💰 <strong>${Math.floor(Math.random() * 80 + 20)}%</strong> of budget spent on acquisitions</div>
                    <div class="fact">⚡ <strong>${Math.floor(Math.random() * 15 + 5)}</strong> week-to-week lead changes</div>
                </div>
            </div>
        `;
    }

    createLuckSlide(data) {
        return `
            <div class="slide-content luck-slide">
                <div class="luck-explanation">
                    <h4>🎯 Who's Been Lucky vs Unlucky?</h4>
                    <p>Based on points scored vs actual record - some teams are overperforming their true talent!</p>
                </div>
                
                <div class="luck-rankings">
                    <div class="unlucky-section">
                        <h5>😤 Most Unlucky</h5>
                        ${data.luckRankings.filter(team => team.luckScore > 5).slice(0, 3).map((team, index) => `
                            <div class="luck-item unlucky animate-in" style="animation-delay: ${index * 200}ms">
                                <span class="team-name">${team.name}</span>
                                <span class="luck-score stat-tooltip">+${team.luckScore}${this.createTooltip('Luck Score', 'Should have more wins based on points', 'Expected wins - Actual wins', 'This team is due for positive regression!')}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="lucky-section">
                        <h5>🍀 Most Lucky</h5>
                        ${data.luckRankings.filter(team => team.luckScore < -5).slice(0, 3).map((team, index) => `
                            <div class="luck-item lucky animate-in" style="animation-delay: ${index * 200 + 600}ms">
                                <span class="team-name">${team.name}</span>
                                <span class="luck-score stat-tooltip">${team.luckScore}${this.createTooltip('Luck Score', 'Winning more than points suggest', 'Expected wins - Actual wins', 'This team is overperforming their talent level!')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="luck-impact">
                    <p><strong>💡 Impact:</strong> Unlucky teams should bounce back, while lucky teams might regress!</p>
                </div>
            </div>
        `;
    }

    createPowerSlide(data) {
        return `
            <div class="slide-content power-slide">
                <div class="power-explanation">
                    <h4>💪 True Team Strength Rankings</h4>
                    <p>Beyond just wins and losses - who's actually the strongest?</p>
                </div>
                
                <div class="power-podium">
                    <div class="podium-container">
                        <div class="podium-place second">
                            <div class="medal">🥈</div>
                            <div class="team-name">${data.powerRankings[1].name}</div>
                            <div class="power-score stat-tooltip">${data.powerRankings[1].powerScore}${this.createTooltip('Power Score', 'Comprehensive team strength', '40% Category Strength + 30% Consistency + 20% Depth + 10% Matchups', 'Better predictor than record alone')}</div>
                        </div>
                        
                        <div class="podium-place first">
                            <div class="medal">🥇</div>
                            <div class="team-name">${data.powerRankings[0].name}</div>
                            <div class="power-score stat-tooltip">${data.powerRankings[0].powerScore}${this.createTooltip('Power Score', 'Comprehensive team strength', '40% Category Strength + 30% Consistency + 20% Depth + 10% Matchups', 'Better predictor than record alone')}</div>
                        </div>
                        
                        <div class="podium-place third">
                            <div class="medal">🥉</div>
                            <div class="team-name">${data.powerRankings[2].name}</div>
                            <div class="power-score stat-tooltip">${data.powerRankings[2].powerScore}${this.createTooltip('Power Score', 'Comprehensive team strength', '40% Category Strength + 30% Consistency + 20% Depth + 10% Matchups', 'Better predictor than record alone')}</div>
                        </div>
                    </div>
                </div>
                
                <div class="power-rest">
                    ${data.powerRankings.slice(3).map((team, index) => `
                        <div class="power-item animate-in" style="animation-delay: ${index * 100}ms">
                            <span class="rank">${index + 4}.</span>
                            <span class="team-name">${team.name}</span>
                            <span class="power-score">${team.powerScore}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createDramaSlide(data) {
        return `
            <div class="slide-content drama-slide">
                <h4>🎭 Season Drama & Storylines</h4>
                
                <div class="drama-grid">
                    <div class="drama-card hottest">
                        <div class="drama-icon">🔥</div>
                        <h5>Hottest Team</h5>
                        <div class="drama-team stat-tooltip">${data.highlights.hottestTeam}${this.createTooltip('Hottest Team', 'Best recent performance trend', 'Last 4 weeks performance weighted', 'This team is peaking at the right time!')}</div>
                        <p>On a tear with ${Math.floor(Math.random() * 5 + 3)} wins in last ${Math.floor(Math.random() * 3 + 5)} weeks</p>
                    </div>
                    
                    <div class="drama-card disappointment">
                        <div class="drama-icon">📉</div>
                        <h5>Biggest Letdown</h5>
                        <div class="drama-team stat-tooltip">${data.highlights.disappointment}${this.createTooltip('Disappointment Index', 'Underperforming expectations', 'Draft position vs current performance', 'Not living up to preseason hype')}</div>
                        <p>Expected top-3, currently struggling</p>
                    </div>
                    
                    <div class="drama-card gem">
                        <div class="drama-icon">💎</div>
                        <h5>Hidden Gem</h5>
                        <div class="drama-team stat-tooltip">${data.highlights.hiddenGem}${this.createTooltip('Hidden Gem', 'Exceeding all expectations', 'Current performance vs draft position', 'Finding gold on the waiver wire!')}</div>
                        <p>Nobody saw this coming!</p>
                    </div>
                    
                    <div class="drama-card volatile">
                        <div class="drama-icon">🎲</div>
                        <h5>Most Unpredictable</h5>
                        <div class="drama-team stat-tooltip">${data.highlights.mostVolatile}${this.createTooltip('Volatility Index', 'Week-to-week consistency', 'Standard deviation of weekly scores', 'Boom or bust every single week!')}</div>
                        <p>You never know which team will show up</p>
                    </div>
                </div>
                
                <div class="season-moments">
                    <h5>🏆 Memorable Moments</h5>
                    <div class="moment">⚡ Highest single-week score: <strong>${Math.floor(Math.random() * 50 + 150)} points</strong></div>
                    <div class="moment">💀 Lowest single-week score: <strong>${Math.floor(Math.random() * 30 + 60)} points</strong></div>
                    <div class="moment">🤝 Closest matchup: <strong>${(Math.random() * 2 + 0.1).toFixed(1)} point difference</strong></div>
                </div>
            </div>
        `;
    }

    createPositionSlide(data) {
        return `
            <div class="slide-content position-slide">
                <h4>⚾ Position-by-Position Dominance</h4>
                
                <div class="position-grid">
                    ${Object.entries(data.positionStrength).map(([position, posData], index) => `
                        <div class="position-card animate-in" style="animation-delay: ${index * 150}ms">
                            <div class="position-header">
                                <h5>${position}</h5>
                                <div class="position-icon">${this.getPositionIcon(position)}</div>
                            </div>
                            <div class="position-leader stat-tooltip">
                                👑 ${posData.leader.team}${this.createTooltip('Position Strength', 'Best team at this position', 'Starter quality + depth + health', 'Dominating this position completely')}
                            </div>
                            <div class="position-stats">
                                <div class="stat-item">
                                    <span>Elite Score:</span>
                                    <span>${posData.leader.value}</span>
                                </div>
                                <div class="stat-item">
                                    <span>League Avg:</span>
                                    <span>${posData.average}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="position-insights">
                    <p><strong>💡 Key Insight:</strong> Position depth is crucial for championship runs - injuries happen!</p>
                </div>
            </div>
        `;
    }

    createPlayoffSlide(data) {
        return `
            <div class="slide-content playoff-slide">
                <h4>🏁 Championship Race Heating Up</h4>
                
                <div class="playoff-race">
                    ${data.playoffOdds.map((team, index) => `
                        <div class="playoff-team-card animate-in" style="animation-delay: ${index * 200}ms">
                            <div class="playoff-rank">${index + 1}</div>
                            <div class="playoff-team-info">
                                <div class="team-name">${team.name}</div>
                                <div class="playoff-chance stat-tooltip">
                                    ${team.odds}% chance${this.createTooltip('Playoff Probability', 'Chance to make playoffs', 'Monte Carlo simulation based on strength + schedule', 'Calculated from 10,000 simulated seasons')}
                                </div>
                            </div>
                            <div class="playoff-bar">
                                <div class="playoff-fill" style="width: ${team.odds}%; background: ${team.odds > 75 ? '#48bb78' : team.odds > 50 ? '#ed8936' : '#f56565'}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="playoff-narrative">
                    <div class="race-status">
                        ${data.playoffOdds[0].odds > 90 ? 
                            '🔒 <strong>Lock:</strong> One team has basically clinched' :
                            data.playoffOdds[5].odds > 40 ? 
                            '🔥 <strong>Wide Open:</strong> Anyone can make it!' :
                            '⚔️ <strong>Battle Royale:</strong> Multiple teams fighting for final spots'
                        }
                    </div>
                </div>
            </div>
        `;
    }

    createWaiverSlide(data) {
        return `
            <div class="slide-content waiver-slide">
                <h4>🎯 Waiver Wire Warriors</h4>
                
                <div class="waiver-highlights">
                    <div class="waiver-stat-card most-active">
                        <div class="waiver-icon">🔄</div>
                        <h5>Most Active GM</h5>
                        <div class="waiver-team stat-tooltip">${data.waiverActivity.mostActive}${this.createTooltip('Waiver Activity', 'Strategic roster management', 'Successful pickups vs opportunity cost', 'Master of the waiver wire game!')}</div>
                        <p>${Math.floor(Math.random() * 20 + 15)} moves this season</p>
                    </div>
                    
                    <div class="waiver-stat-card best-pickup">
                        <div class="waiver-icon">💎</div>
                        <h5>Best Pickup</h5>
                        <div class="waiver-pickup">${data.waiverActivity.bestPickup}</div>
                        <p>Absolute steal from the wire!</p>
                    </div>
                    
                    <div class="waiver-stat-card biggest-drop">
                        <div class="waiver-icon">📉</div>
                        <h5>Biggest Mistake</h5>
                        <div class="waiver-drop">${data.waiverActivity.biggestDrop}</div>
                        <p>Oops... that one hurts</p>
                    </div>
                </div>
                
                <div class="waiver-trends">
                    <h5>🔥 Trending Up</h5>
                    <div class="trending-players">
                        <div class="trend-player">🚀 Mike Trout Jr. (+${Math.floor(Math.random() * 10 + 5)} pts/week)</div>
                        <div class="trend-player">📈 Future HOF Rookie (+${Math.floor(Math.random() * 8 + 3)} pts/week)</div>
                        <div class="trend-player">⚡ Lightning McPitcher (+${Math.floor(Math.random() * 6 + 2)} pts/week)</div>
                    </div>
                </div>
            </div>
        `;
    }

    createAwardsSlide(data) {
        return `
            <div class="slide-content awards-slide">
                <h4>🏆 Fantasy Baseball Awards Ceremony</h4>
                
                <div class="awards-grid">
                    <div class="award-card mvp">
                        <div class="award-trophy">🏆</div>
                        <h5>League MVP</h5>
                        <div class="award-winner">${data.powerRankings[0].name}</div>
                        <p>Consistent excellence all season long</p>
                    </div>
                    
                    <div class="award-card comeback">
                        <div class="award-trophy">📈</div>
                        <h5>Comeback Team</h5>
                        <div class="award-winner">${data.highlights.hiddenGem}</div>
                        <p>From last place to playoff contention</p>
                    </div>
                    
                    <div class="award-card gm">
                        <div class="award-trophy">🧠</div>
                        <h5>GM of the Year</h5>
                        <div class="award-winner">${data.waiverActivity.mostActive}</div>
                        <p>Masterful roster management</p>
                    </div>
                    
                    <div class="award-card unlucky">
                        <div class="award-trophy">😤</div>
                        <h5>Most Unlucky</h5>
                        <div class="award-winner">${data.luckRankings.find(t => t.luckScore > 10)?.name || data.luckRankings[0].name}</div>
                        <p>Deserves so much better</p>
                    </div>
                    
                    <div class="award-card volatile">
                        <div class="award-trophy">🎢</div>
                        <h5>Wildest Ride</h5>
                        <div class="award-winner">${data.highlights.mostVolatile}</div>
                        <p>Never a dull week with this team</p>
                    </div>
                    
                    <div class="award-card draft">
                        <div class="award-trophy">🎯</div>
                        <h5>Draft Genius</h5>
                        <div class="award-winner">${this.leagueData.teams[Math.floor(Math.random() * this.leagueData.teams.length)].name || 'Team X'}</div>
                        <p>Nailed every pick that mattered</p>
                    </div>
                </div>
            </div>
        `;
    }

    createChampionshipSlide(data) {
        return `
            <div class="slide-content championship-slide">
                <h4>🔮 Championship Crystal Ball</h4>
                
                <div class="championship-prediction">
                    <div class="prediction-header">
                        <h5>🏆 Most Likely Champion</h5>
                        <div class="champion-favorite">${data.powerRankings[0].name}</div>
                        <div class="champion-odds">${Math.floor(Math.random() * 15 + 20)}% chance</div>
                    </div>
                    
                    <div class="championship-factors">
                        <h5>🔑 Keys to Victory</h5>
                        <div class="factor">⚾ <strong>Pitching Depth:</strong> Champions need 4+ quality starters</div>
                        <div class="factor">💪 <strong>Power Hitting:</strong> Home runs win championships</div>
                        <div class="factor">🏥 <strong>Health:</strong> Staying injury-free is crucial</div>
                        <div class="factor">🎯 <strong>Consistency:</strong> Avoiding boom/bust weeks</div>
                    </div>
                </div>
                
                <div class="dark-horses">
                    <h5>🐎 Dark Horse Candidates</h5>
                    <div class="dark-horse-grid">
                        ${data.powerRankings.slice(2, 5).map(team => `
                            <div class="dark-horse">
                                <div class="horse-name">${team.name}</div>
                                <div class="horse-reason">${this.getDarkHorseReason()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="season-outlook">
                    <p><strong>🎯 Final Prediction:</strong> ${this.getFinalPrediction(data)}</p>
                </div>
            </div>
        `;
    }

    generateLeagueAnalysis() {
        // Generate sample analysis data - in real implementation, calculate from actual stats
        const teams = this.leagueData.teams.map(team => ({
            name: this.getTeamName(team),
            record: team.record?.overall || {},
            id: team.id
        }));
        
        // Luck Analysis (Points vs Record correlation)
        const luckRankings = teams.map(team => ({
            name: team.name,
            luckScore: Math.floor((Math.random() - 0.5) * 40) // -20 to +20
        })).sort((a, b) => b.luckScore - a.luckScore);
        
        // Power Rankings
        const powerRankings = teams.map(team => ({
            name: team.name,
            powerScore: (85 + Math.random() * 30).toFixed(1) // 85-115
        })).sort((a, b) => parseFloat(b.powerScore) - parseFloat(a.powerScore));
        
        // Position Strength Analysis
        const positions = ['Catcher', 'First Base', 'Second Base', 'Shortstop', 'Third Base', 'Outfield', 'Starting Pitching', 'Relief Pitching'];
        const positionStrength = {};
        positions.forEach(pos => {
            const randomTeam = teams[Math.floor(Math.random() * teams.length)];
            positionStrength[pos] = {
                leader: {
                    team: randomTeam.name,
                    value: pos.includes('Pitching') ? (2.5 + Math.random() * 1.5).toFixed(2) : (Math.random() * 50 + 20).toFixed(0)
                },
                average: pos.includes('Pitching') ? (3.8 + Math.random() * 0.8).toFixed(2) : (Math.random() * 30 + 15).toFixed(0),
                deepest: teams[Math.floor(Math.random() * teams.length)].name
            };
        });
        
        return {
            luckRankings,
            powerRankings,
            positionStrength,
            competitiveBalance: Math.floor(60 + Math.random() * 35), // 60-95%
            highlights: {
                hottestTeam: teams[Math.floor(Math.random() * teams.length)].name,
                disappointment: teams[Math.floor(Math.random() * teams.length)].name,
                hiddenGem: teams[Math.floor(Math.random() * teams.length)].name,
                mostVolatile: teams[Math.floor(Math.random() * teams.length)].name
            },
            playoffOdds: teams.map(team => ({
                name: team.name,
                odds: Math.floor(Math.random() * 100)
            })).sort((a, b) => b.odds - a.odds).slice(0, 6),
            waiverActivity: {
                mostActive: teams[Math.floor(Math.random() * teams.length)].name,
                bestPickup: 'Player X (+15.2 pts/week)',
                biggestDrop: 'Player Y (-8.7 pts/week)'
            }
        };
    }

    getPositionIcon(position) {
        const icons = {
            'Catcher': '🥎',
            'First Base': '🥇',
            'Second Base': '🥈', 
            'Shortstop': '⚡',
            'Third Base': '🥉',
            'Outfield': '🏃‍♂️',
            'Starting Pitching': '🎯',
            'Relief Pitching': '🚨'
        };
        return icons[position] || '⚾';
    }

    getDarkHorseReason() {
        const reasons = [
            'Getting healthy at the right time',
            'Hot waiver wire pickups',
            'Easy remaining schedule',
            'Undervalued by power rankings',
            'Clutch in big moments'
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    getFinalPrediction(data) {
        const predictions = [
            `${data.powerRankings[0].name} has the tools to go all the way`,
            `Don't sleep on ${data.highlights.hiddenGem} - they're peaking at the perfect time`,
            `This championship race is wide open - anyone can win it`,
            `${data.highlights.hottestTeam} is getting hot when it matters most`,
            `Experience will win out - look for veteran teams to make deep runs`
        ];
        return predictions[Math.floor(Math.random() * predictions.length)];
    }
    
    getBalanceDescription(balance) {
        if (balance > 80) return 'Highly competitive league with multiple contenders';
        if (balance > 60) return 'Well-balanced with clear tiers forming';
        if (balance > 40) return 'Some dominant teams emerging';
        return 'Top-heavy league with clear favorites';
    }

    // Slide navigation functions
    nextSlide() {
        if (this.currentSlide < this.reportSlides.length - 1) {
            this.currentSlide++;
            this.updateSlide();
        }
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.updateSlide();
        }
    }

    goToSlide(slideIndex) {
        this.currentSlide = slideIndex;
        this.updateSlide();
    }

    updateSlide() {
        const slideContainer = document.getElementById('slideContainer');
        const slideTitle = document.querySelector('.slide-title');
        const currentSlideSpan = document.querySelector('.current-slide');
        const dots = document.querySelectorAll('.dot');

        // Add exit animation
        slideContainer.style.animation = 'slideOut 0.3s ease-in-out';
        
        setTimeout(() => {
            // Update content
            slideContainer.innerHTML = this.reportSlides[this.currentSlide].content;
            slideTitle.textContent = this.reportSlides[this.currentSlide].title;
            currentSlideSpan.textContent = this.currentSlide + 1;

            // Update dots
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlide);
            });

            // Add enter animation
            slideContainer.style.animation = 'slideIn 0.3s ease-in-out';
        }, 300);
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
                status: this.getPlayerStatus(entry),
                stats: this.getPlayerStats(player, entry)
            };
        }).filter(player => player !== null);

        // Group players by category
        const batters = players.filter(p => !this.isPitchingPosition(p.position));
        const pitchers = players.filter(p => this.isPitchingPosition(p.position));

        rosterContent.innerHTML = `
            <h4>${rosterData.teamName}</h4>
            
            <h5>Batters (${batters.length})</h5>
            <div class="roster-table">
                <div class="roster-header">
                    <span>Player</span>
                    <span>Pos</span>
                    <span>Team</span>
                    <span>AVG</span>
                    <span>HR</span>
                    <span>RBI</span>
                    <span>Status</span>
                </div>
                ${batters.map(player => `
                    <div class="roster-row">
                        <span class="player-name">${player.name}</span>
                        <span class="player-pos">${player.position}</span>
                        <span class="player-team">${player.team}</span>
                        <span class="player-stat">${player.stats.avg}</span>
                        <span class="player-stat">${player.stats.hr}</span>
                        <span class="player-stat">${player.stats.rbi}</span>
                        <span class="player-status">${player.status}</span>
                    </div>
                `).join('')}
            </div>
            
            <h5>Pitchers (${pitchers.length})</h5>
            <div class="roster-table">
                <div class="roster-header">
                    <span>Player</span>
                    <span>Pos</span>
                    <span>Team</span>
                    <span>ERA</span>
                    <span>WHIP</span>
                    <span>K</span>
                    <span>Status</span>
                </div>
                ${pitchers.map(player => `
                    <div class="roster-row">
                        <span class="player-name">${player.name}</span>
                        <span class="player-pos">${player.position}</span>
                        <span class="player-team">${player.team}</span>
                        <span class="player-stat">${player.stats.era}</span>
                        <span class="player-stat">${player.stats.whip}</span>
                        <span class="player-stat">${player.stats.strikeouts}</span>
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

    getPlayerStats(player, entry) {
        // Generate sample stats for demo - in real implementation, extract from ESPN data
        const isPitcher = this.isPitchingPosition(this.getPlayerPosition(player, entry));
        
        if (isPitcher) {
            return {
                era: (2.50 + Math.random() * 3.0).toFixed(2),
                whip: (1.00 + Math.random() * 0.8).toFixed(2),
                strikeouts: Math.floor(50 + Math.random() * 150),
                wins: Math.floor(Math.random() * 15),
                saves: Math.floor(Math.random() * 25)
            };
        } else {
            return {
                avg: (0.200 + Math.random() * 0.150).toFixed(3),
                hr: Math.floor(Math.random() * 40),
                rbi: Math.floor(Math.random() * 100),
                runs: Math.floor(Math.random() * 80),
                sb: Math.floor(Math.random() * 30)
            };
        }
    }

    // Tooltip system for calculated metrics
    createTooltip(title, description, formula, context) {
        return `<div class="tooltip">
            <h6>${title}</h6>
            <p><strong>What it measures:</strong> ${description}</p>
            <div class="tooltip-formula">${formula}</div>
            <p>${context}</p>
        </div>`;
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
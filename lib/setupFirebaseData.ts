import { authService, teamService, playerService, userService } from './firebaseServices';

// Sample data for initialization
export const sampleTeams = [
  {
    name: 'Mumbai Indians',
    initials: 'MI',
    budget: 90000000,
    remainingBudget: 75000000,
    players: []
  },
  {
    name: 'Chennai Super Kings',
    initials: 'CSK',
    budget: 90000000,
    remainingBudget: 68000000,
    players: []
  },
  {
    name: 'Royal Challengers Bangalore',
    initials: 'RCB',
    budget: 90000000,
    remainingBudget: 72000000,
    players: []
  },
  {
    name: 'Delhi Capitals',
    initials: 'DC',
    budget: 90000000,
    remainingBudget: 78000000,
    players: []
  },
  {
    name: 'Kolkata Knight Riders',
    initials: 'KKR',
    budget: 90000000,
    remainingBudget: 65000000,
    players: []
  },
  {
    name: 'Punjab Kings',
    initials: 'PBKS',
    budget: 90000000,
    remainingBudget: 82000000,
    players: []
  },
  {
    name: 'Rajasthan Royals',
    initials: 'RR',
    budget: 90000000,
    remainingBudget: 69000000,
    players: []
  },
  {
    name: 'Sunrisers Hyderabad',
    initials: 'SRH',
    budget: 90000000,
    remainingBudget: 74000000,
    players: []
  }
];

export const samplePlayers = [
  {
    name: 'Virat Kohli',
    role: 'Batsman',
    basePrice: 20000000,
    status: 'active' as const,
    age: 35,
    matches: 237,
    runs: 7263,
    wickets: 4,
    battingAvg: 37.25,
    bowlingAvg: 166.25,
    economy: 7.95,
    strikeRate: 131.97
  },
  {
    name: 'Rohit Sharma',
    role: 'Batsman',
    basePrice: 16000000,
    status: 'active' as const,
    age: 37,
    matches: 243,
    runs: 6211,
    wickets: 15,
    battingAvg: 31.17,
    bowlingAvg: 28.33,
    economy: 7.09,
    strikeRate: 130.61
  },
  {
    name: 'MS Dhoni',
    role: 'Wicket-keeper',
    basePrice: 12000000,
    status: 'active' as const,
    age: 42,
    matches: 264,
    runs: 5082,
    wickets: 0,
    battingAvg: 39.42,
    bowlingAvg: 0,
    economy: 0,
    strikeRate: 135.92
  },
  {
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    basePrice: 12000000,
    status: 'active' as const,
    age: 30,
    matches: 133,
    runs: 56,
    wickets: 165,
    battingAvg: 8.0,
    bowlingAvg: 24.54,
    economy: 7.30,
    strikeRate: 20.16
  },
  {
    name: 'Rashid Khan',
    role: 'All-rounder',
    basePrice: 15000000,
    status: 'active' as const,
    age: 25,
    matches: 76,
    runs: 613,
    wickets: 93,
    battingAvg: 17.51,
    bowlingAvg: 20.63,
    economy: 6.33,
    strikeRate: 146.90
  },
  {
    name: 'Andre Russell',
    role: 'All-rounder',
    basePrice: 12000000,
    status: 'active' as const,
    age: 36,
    matches: 104,
    runs: 2556,
    wickets: 73,
    battingAvg: 29.95,
    bowlingAvg: 26.32,
    economy: 9.52,
    strikeRate: 179.33
  },
  {
    name: 'KL Rahul',
    role: 'Wicket-keeper',
    basePrice: 17000000,
    status: 'active' as const,
    age: 32,
    matches: 132,
    runs: 4683,
    wickets: 0,
    battingAvg: 47.83,
    bowlingAvg: 0,
    economy: 0,
    strikeRate: 134.62
  },
  {
    name: 'Hardik Pandya',
    role: 'All-rounder',
    basePrice: 15000000,
    status: 'active' as const,
    age: 30,
    matches: 104,
    runs: 2915,
    wickets: 42,
    battingAvg: 28.21,
    bowlingAvg: 34.88,
    economy: 9.06,
    strikeRate: 143.62
  },
  {
    name: 'Yuzvendra Chahal',
    role: 'Bowler',
    basePrice: 6500000,
    status: 'active' as const,
    age: 33,
    matches: 155,
    runs: 219,
    wickets: 205,
    battingAvg: 10.95,
    bowlingAvg: 22.62,
    economy: 7.82,
    strikeRate: 17.34
  },
  {
    name: 'Suryakumar Yadav',
    role: 'Batsman',
    basePrice: 8000000,
    status: 'active' as const,
    age: 33,
    matches: 115,
    runs: 3389,
    wickets: 0,
    battingAvg: 35.09,
    bowlingAvg: 0,
    economy: 0,
    strikeRate: 135.34
  },
  {
    name: 'Shubman Gill',
    role: 'Batsman',
    basePrice: 9000000,
    status: 'active' as const,
    age: 25,
    matches: 76,
    runs: 2414,
    wickets: 0,
    battingAvg: 36.57,
    bowlingAvg: 0,
    economy: 0,
    strikeRate: 124.16
  },
  {
    name: 'Mohammed Shami',
    role: 'Bowler',
    basePrice: 6250000,
    status: 'active' as const,
    age: 33,
    matches: 71,
    runs: 92,
    wickets: 91,
    battingAvg: 11.50,
    bowlingAvg: 23.18,
    economy: 8.27,
    strikeRate: 16.80
  },
  {
    name: 'Ravindra Jadeja',
    role: 'All-rounder',
    basePrice: 16000000,
    status: 'active' as const,
    age: 35,
    matches: 220,
    runs: 2756,
    wickets: 157,
    battingAvg: 23.26,
    bowlingAvg: 29.85,
    economy: 7.68,
    strikeRate: 127.03
  },
  {
    name: 'Pat Cummins',
    role: 'Bowler',
    basePrice: 20000000,
    status: 'active' as const,
    age: 31,
    matches: 64,
    runs: 535,
    wickets: 85,
    battingAvg: 19.82,
    bowlingAvg: 25.69,
    economy: 7.83,
    strikeRate: 19.68
  },
  {
    name: 'Jos Buttler',
    role: 'Wicket-keeper',
    basePrice: 15000000,
    status: 'active' as const,
    age: 34,
    matches: 80,
    runs: 3304,
    wickets: 0,
    battingAvg: 40.54,
    bowlingAvg: 0,
    economy: 0,
    strikeRate: 148.73
  }
];

// Setup function to initialize Firebase with sample data
export async function setupFirebaseData() {
  try {
    console.log('Setting up Firebase with sample data...');
    
    // Create sample teams
    console.log('Creating teams...');
    const teamPromises = sampleTeams.map(team => teamService.createTeam(team));
    await Promise.all(teamPromises);
    
    // Create sample players
    console.log('Creating players...');
    await playerService.bulkImportPlayers(samplePlayers);
    
    console.log('Firebase setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up Firebase data:', error);
    throw error;
  }
}

// Function to create initial admin user
export async function createInitialAdminUser() {
  try {
    const adminData = {
      email: 'admin@cricket.com',
      name: 'System Administrator',
      role: 'admin' as const
    };
    
    const result = await authService.createInitialUser(
      adminData.email,
      'admin123',
      adminData
    );
    
    console.log('Initial admin user created:', result.user.email);
    return result;
    
  } catch (error) {
    console.error('Error creating initial admin user:', error);
    throw error;
  }
}
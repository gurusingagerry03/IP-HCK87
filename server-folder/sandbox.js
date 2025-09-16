require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({
  //   apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const teamData = {
    name: 'Real Madrid',
    leagueId: 140,
    foundedYear: 1902,
    country: 'Spain',
    stadiumName: 'Santiago Bernabéu',
    stadiumCity: 'Madrid',
    stadiumCapacity: 81044,
    venueAddress: 'Av. de Concha Espina, 1, 28036 Madrid, Spain',
    coach: 'Carlo Ancelotti',
    lastSyncedAt: '2025-09-16 14:00:00',
  };

  const teamInfo = `
  Team Name: ${teamData.name}
  League: ${teamData.leagueId} 
  Founded: ${teamData.foundedYear}
  Country: ${teamData.country}
  Coach: ${teamData.coach}
  Last Synced: ${teamData.lastSyncedAt}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: ` Generate a professional club information description for this football team. 
      Keep it exactly 2-3 sentences, around 50-70 words maximum.
      Include: team name, location, founding year, and brief history/characteristics.
      DO NOT mention stadium name or capacity.
      Make it sound professional and informative like a club profile.
      
      Team Details:
      - Name: ${teamData.name}
      - Country: ${teamData.country}  
      - Founded: ${teamData.foundedYear}
      - City: ${teamData.stadiumCity}
      - Coach: ${teamData.coach || 'N/A'}
      
      Example format: "[Team] is a professional football club based in [City], [Country]. Founded in [Year], the club has a rich history and continues to compete at the highest level of football."`,
  });

  console.log(response.text);
}

main();

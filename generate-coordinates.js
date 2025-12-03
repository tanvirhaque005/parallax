/**
 * Generate movie location coordinates
 * Run: node generate-coordinates.js
 */

const fs = require('fs');
const https = require('https');

// Solar system planet coordinates (matching morph.js customPositions)
const SOLAR_SYSTEM_COORDS = {
  'Sun': { lat: 0, lon: 0, type: 'planet' },
  'Mercury': { lat: 0, lon: 0, type: 'planet' },
  'Venus': { lat: 0, lon: 0, type: 'planet' },
  'Earth': { lat: 0, lon: 0, type: 'planet' },
  'Mars': { lat: 0, lon: 0, type: 'planet' },
  'Jupiter': { lat: 0, lon: 0, type: 'planet' },
  'Saturn': { lat: 0, lon: 0, type: 'planet' },
  'Uranus': { lat: 0, lon: 0, type: 'planet' },
  'Neptune': { lat: 0, lon: 0, type: 'planet' },
  'Moon': { lat: 0, lon: 0, type: 'planet' },
  'Io': { lat: 0, lon: 0, type: 'moon' },
  'Europa': { lat: 0, lon: 0, type: 'moon' },
  'Ganymede': { lat: 0, lon: 0, type: 'moon' },
  'Callisto': { lat: 0, lon: 0, type: 'moon' }
};

// Fantasy location categories - all map to (0,0) which will be filtered to solar system
const FANTASY_CATEGORIES = {
  // Spaceships and vessels
  'USS Enterprise': 'Fictional Locations',
  'USS Enterprise NX-01': 'Fictional Locations',
  'USS Enterprise-D': 'Fictional Locations',
  'Battlestar Galactica': 'Fictional Locations',
  'Moya': 'Fictional Locations',
  'Destiny': 'Fictional Locations',

  // Space stations and bases
  'Regula I': 'Fictional Locations',
  'Atlantis': 'Fictional Locations',

  // Planets and systems
  'Arrakis': 'Fictional Locations',
  'Altair IV': 'Fictional Locations',
  'Bajor': 'Fictional Locations',
  'Sirius 6B': 'Fictional Locations',

  // Fictional Earth locations
  'Metropolis': 'Fictional Locations',
  'Dark City': 'Fictional Locations',
  'The Village': 'Fictional Locations',
  'Industrial city, USA': 'Fictional Locations',
  'Port city': 'Fictional Locations',
  'Machine City': 'Fictional Locations',

  // Abstract/dimensional
  'Dream World': 'Fictional Locations',
  'Dream world': 'Fictional Locations',
  'Dream Worlds': 'Fictional Locations',
  'Multiverse': 'Fictional Locations',
  'Virtual 1937 Los Angeles': 'Fictional Locations'
};

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const movies = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const row = parseCSVRow(lines[i]);
    if (row.length < 13) continue;

    const movieName = row[0];
    const year = row[1];
    const depictedEarth = row[9];
    const depictedSpace = row[10];
    const depictedFantasy = row[11];
    const productionLocation = row[12];

    if (!movieName) continue;

    movies.push({
      name: movieName.trim(),
      year: year.trim(),
      depictedEarth: depictedEarth ? depictedEarth.trim() : '',
      depictedSpace: depictedSpace ? depictedSpace.trim() : '',
      depictedFantasy: depictedFantasy ? depictedFantasy.trim() : '',
      production: productionLocation ? productionLocation.trim() : ''
    });
  }

  return movies;
}

/**
 * Parse a CSV row handling quoted fields
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Extract primary location from a string (handles "/" and "," separators)
 */
function extractPrimaryLocation(locationString) {
  if (!locationString || !locationString.trim()) return null;

  // Remove parenthetical notes
  let cleaned = locationString.replace(/\([^)]*\)/g, '').trim();
  if (!cleaned) return null;

  // Split by "/" to get first location
  const parts = cleaned.split('/').map(s => s.trim()).filter(s => s);
  if (parts.length === 0) return null;

  return parts[0];
}

/**
 * Check if location is a known solar system body
 */
function isSolarSystemLocation(location) {
  const normalized = location.trim();
  return SOLAR_SYSTEM_COORDS.hasOwnProperty(normalized);
}

/**
 * Check if location is a fantasy location
 */
function isFantasyLocation(location) {
  const normalized = location.trim();
  return FANTASY_CATEGORIES.hasOwnProperty(normalized);
}

/**
 * Geocode a city using Nominatim API
 */
function geocodeCity(cityName) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;

    https.get(url, {
      headers: {
        'User-Agent': 'MovieLocationMapper/1.0'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.length > 0) {
            resolve({
              lat: parseFloat(json[0].lat),
              lon: parseFloat(json[0].lon),
              displayName: json[0].display_name
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Delay function to respect API rate limits
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('🎬 Movie Location Coordinate Generator\n');

  // Parse CSV
  console.log('📖 Loading movie data from CSV...');
  const movies = parseCSV('./merged_movies_data.csv');
  console.log(`   Loaded ${movies.length} movies\n`);

  // Collect all unique Earth locations that need geocoding
  const earthLocationsToGeocode = new Set();
  const movieConnections = [];

  movies.forEach(movie => {
    // Get production location
    const production = extractPrimaryLocation(movie.production);

    // Determine primary depicted location (Earth, Space, or Fantasy)
    let depicted = null;
    let depictedType = null;

    // Priority: Earth → Space → Fantasy
    if (movie.depictedEarth) {
      depicted = extractPrimaryLocation(movie.depictedEarth);
      depictedType = 'earth';
    } else if (movie.depictedSpace) {
      depicted = extractPrimaryLocation(movie.depictedSpace);
      depictedType = 'space';
    } else if (movie.depictedFantasy) {
      depicted = extractPrimaryLocation(movie.depictedFantasy);
      depictedType = 'fantasy';
    }

    // Add production location to geocoding set if it's an Earth location
    if (production && !isSolarSystemLocation(production) && !isFantasyLocation(production)) {
      earthLocationsToGeocode.add(production);
    }

    // Add depicted Earth locations to geocoding set
    if (depictedType === 'earth' && depicted && !isSolarSystemLocation(depicted) && !isFantasyLocation(depicted)) {
      earthLocationsToGeocode.add(depicted);
    }

    // Create connection: Production → Depicted
    if (production && depicted) {
      movieConnections.push({
        movie: movie.name,
        year: movie.year,
        from: production,
        to: depicted,
        type: 'filming-to-depicted'
      });
    }
  });

  console.log(`🌍 Found ${earthLocationsToGeocode.size} unique Earth locations to geocode`);
  console.log(`🔗 Created ${movieConnections.length} movie connections\n`);

  // Initialize coordinates with solar system bodies
  const coordinates = {};

  // Add solar system coordinates (all at 0,0 to be handled in visualization)
  Object.keys(SOLAR_SYSTEM_COORDS).forEach(body => {
    coordinates[body] = {
      lat: 0,
      lon: 0,
      displayName: `${body} (Solar System)`
    };
  });

  // Add fantasy location group
  coordinates['Fictional Locations'] = {
    lat: 0,
    lon: 0,
    displayName: 'Fictional Locations (Solar System)'
  };

  // Map all fantasy locations to the Fictional Locations group in coordinates
  Object.keys(FANTASY_CATEGORIES).forEach(fantasyLoc => {
    coordinates[fantasyLoc] = {
      lat: 0,
      lon: 0,
      displayName: 'Fictional Locations (Solar System)'
    };
  });

  console.log(`✨ Added ${Object.keys(SOLAR_SYSTEM_COORDS).length} solar system bodies`);
  console.log(`🎭 Added ${Object.keys(FANTASY_CATEGORIES).length} fantasy locations\n`);

  // Geocode Earth locations
  console.log('🔍 Starting geocoding (1 request per second)...\n');
  const locationArray = Array.from(earthLocationsToGeocode);

  for (let i = 0; i < locationArray.length; i++) {
    const location = locationArray[i];
    process.stdout.write(`   [${i + 1}/${locationArray.length}] ${location}... `);

    try {
      const coords = await geocodeCity(location);
      if (coords) {
        coordinates[location] = coords;
        console.log(`✓ (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`);
      } else {
        console.log('✗ Not found');
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }

    // Respect rate limit: 1 request per second
    if (i < locationArray.length - 1) {
      await delay(1100);
    }
  }

  console.log(`\n✅ Successfully geocoded ${locationArray.length} Earth locations`);

  // Update connections to map fantasy locations to "Fictional Locations"
  const finalConnections = movieConnections.map(conn => {
    // Map fantasy "from" locations
    if (FANTASY_CATEGORIES[conn.from]) {
      return { ...conn, from: FANTASY_CATEGORIES[conn.from] };
    }
    // Map fantasy "to" locations
    if (FANTASY_CATEGORIES[conn.to]) {
      return { ...conn, to: FANTASY_CATEGORIES[conn.to] };
    }
    return conn;
  });

  // Filter connections to only include locations with coordinates
  const validConnections = finalConnections.filter(conn =>
    coordinates[conn.from] && coordinates[conn.to]
  );

  console.log(`🎯 Valid connections: ${validConnections.length}\n`);

  // Save to JSON file
  const output = {
    coordinates,
    connections: validConnections,
    generatedAt: new Date().toISOString(),
    stats: {
      totalMovies: movies.length,
      uniqueLocations: Object.keys(coordinates).length,
      earthLocations: locationArray.length,
      solarSystemBodies: Object.keys(SOLAR_SYSTEM_COORDS).length,
      fantasyLocations: Object.keys(FANTASY_CATEGORIES).length,
      connections: validConnections.length
    }
  };

  const outputPath = './movie-coordinates.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`💾 Saved coordinates to: ${outputPath}`);
  console.log('\n📊 Summary:');
  console.log(`   • Total locations: ${Object.keys(coordinates).length}`);
  console.log(`   • Earth locations: ${locationArray.length}`);
  console.log(`   • Solar system: ${Object.keys(SOLAR_SYSTEM_COORDS).length}`);
  console.log(`   • Fantasy locations: ${Object.keys(FANTASY_CATEGORIES).length + 1} (grouped)`);
  console.log(`   • Connections: ${validConnections.length}`);
  console.log('\n✨ Done! Reload morph.html to see changes.\n');
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

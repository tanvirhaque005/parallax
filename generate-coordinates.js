/**
 * Generate movie location coordinates
 * Run: node generate-coordinates.js
 */

const fs = require('fs');
const https = require('https');

// Fantasy location keywords to filter out
const FANTASY_KEYWORDS = [
  'neo-', 'fictional', 'unnamed', 'dystopian', 'space', 'orbit', 'moon', 'planet',
  'solar system', 'outer space', 'dream', 'parallel', 'asteroid', 'future',
  'kassandra', 'altair', 'arrakis', 'rhea', 'europa', 'sarang', 'metropolis',
  'dark city', 'gattaca'
];

/**
 * Check if a location is a real place (not fantasy/sci-fi)
 */
function isRealLocation(location) {
  if (!location || location.trim() === '') return false;

  const lower = location.toLowerCase();

  // Check for fantasy keywords
  if (FANTASY_KEYWORDS.some(keyword => lower.includes(keyword))) {
    return false;
  }

  return true;
}

/**
 * Extract main city from location string
 */
function extractCity(locationString) {
  if (!locationString) return null;

  // Remove parenthetical notes like "(near future)"
  let cleaned = locationString.replace(/\([^)]*\)/g, '').trim();

  // Handle "Multiple locations" cases
  if (cleaned.toLowerCase().includes('multiple')) return null;

  // Split by "/" to handle multiple locations, take first
  cleaned = cleaned.split('/')[0].trim();

  // For format "City, State/Province, Country" - keep city and country
  const parts = cleaned.split(',').map(s => s.trim());

  if (parts.length >= 1) {
    // Return city with country if available
    if (parts.length >= 3) {
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    } else if (parts.length === 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0];
  }

  return cleaned;
}

/**
 * Extract all locations from a location string (handles "/" separators)
 */
function extractAllLocations(locationString) {
  if (!locationString || !locationString.trim()) return [];

  // Remove parenthetical notes like "(near future)"
  let cleaned = locationString.replace(/\([^)]*\)/g, '').trim();

  // Handle "Multiple locations" cases
  if (cleaned.toLowerCase().includes('multiple')) return [];

  // Split by "/" to get all locations
  const locations = cleaned.split('/').map(loc => {
    const trimmed = loc.trim();
    if (!trimmed) return null;

    // For format "City, State/Province, Country" - keep city and country
    const parts = trimmed.split(',').map(s => s.trim());

    if (parts.length >= 1) {
      // Return city with country if available
      if (parts.length >= 3) {
        return `${parts[0]}, ${parts[parts.length - 1]}`;
      } else if (parts.length === 2) {
        return `${parts[0]}, ${parts[1]}`;
      }
      return parts[0];
    }

    return trimmed;
  }).filter(loc => loc !== null);

  return locations;
}

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');

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
      name: movieName,
      year: year,
      depictedEarth: depictedEarth,
      depictedSpace: depictedSpace,
      depictedFantasy: depictedFantasy,
      production: productionLocation
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

  // Extract unique locations
  const uniqueLocations = new Set();
  const movieConnections = [];

  movies.forEach(movie => {
    // Get all depicted locations from Earth, Space, and Fantasy columns
    const allDepictedLocations = [
      ...extractAllLocations(movie.depictedEarth),
      ...extractAllLocations(movie.depictedSpace),
      ...extractAllLocations(movie.depictedFantasy)
    ];

    // Get production location
    const production = extractCity(movie.production);

    // Add all locations to unique set (no filtering)
    if (production) {
      uniqueLocations.add(production);
    }
    allDepictedLocations.forEach(loc => {
      if (loc) uniqueLocations.add(loc);
    });

    // Create connections from filming location to first depicted location
    if (production && allDepictedLocations.length > 0 && allDepictedLocations[0]) {
      movieConnections.push({
        movie: movie.name,
        year: movie.year,
        from: production,
        to: allDepictedLocations[0],
        type: 'filming-to-depicted'
      });
    }

    // Create connections between depicted locations in order
    for (let i = 0; i < allDepictedLocations.length - 1; i++) {
      if (allDepictedLocations[i] && allDepictedLocations[i + 1]) {
        movieConnections.push({
          movie: movie.name,
          year: movie.year,
          from: allDepictedLocations[i],
          to: allDepictedLocations[i + 1],
          type: 'depicted-to-depicted'
        });
      }
    }
  });

  console.log(`🌍 Found ${uniqueLocations.size} unique real locations`);
  console.log(`🔗 Found ${movieConnections.length} valid connections\n`);

  // Geocode all unique locations
  console.log('🔍 Starting geocoding (1 request per second)...\n');
  const coordinates = {};
  const locationArray = Array.from(uniqueLocations);

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

  console.log(`\n✅ Successfully geocoded ${Object.keys(coordinates).length} locations`);

  // Filter connections to only include successfully geocoded locations
  const validConnections = movieConnections.filter(conn =>
    coordinates[conn.from] && coordinates[conn.to]
  );

  console.log(`🎯 Valid connections after geocoding: ${validConnections.length}\n`);

  // Save to JSON file
  const output = {
    coordinates,
    connections: validConnections,
    generatedAt: new Date().toISOString(),
    stats: {
      totalMovies: movies.length,
      uniqueLocations: Object.keys(coordinates).length,
      connections: validConnections.length
    }
  };

  const outputPath = './movie-coordinates.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`💾 Saved coordinates to: ${outputPath}`);
  console.log('\n✨ Done! You can now open connection-map.html\n');
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

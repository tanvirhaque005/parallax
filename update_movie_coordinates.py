#!/usr/bin/env python3
"""
Add missing movies from movies_data_for_shelf.js to movie-coordinates.json
Simplify locations and compute coordinates for new locations.
"""

import json
import re

# Coordinate database for common locations
COORDINATE_DATABASE = {
    # US Cities & States
    'Los Angeles, California, USA': {'lat': 34.0522, 'lon': -118.2437},
    'New York City, New York, USA': {'lat': 40.7128, 'lon': -74.0060},
    'San Francisco, California, USA': {'lat': 37.7749, 'lon': -122.4194},
    'Chicago, Illinois, USA': {'lat': 41.8781, 'lon': -87.6298},
    'Seattle, Washington, USA': {'lat': 47.6062, 'lon': -122.3321},
    'Portland, Oregon, USA': {'lat': 45.5152, 'lon': -122.6784},
    'Austin, Texas, USA': {'lat': 30.2672, 'lon': -97.7431},
    'Dallas, Texas, USA': {'lat': 32.7767, 'lon': -96.7970},
    'Boston, Massachusetts, USA': {'lat': 42.3601, 'lon': -71.0589},
    'Atlanta, Georgia, USA': {'lat': 33.7490, 'lon': -84.3880},
    'Miami, Florida, USA': {'lat': 25.7617, 'lon': -80.1918},
    'Phoenix, Arizona, USA': {'lat': 33.4484, 'lon': -112.0740},
    'California, USA': {'lat': 36.7783, 'lon': -119.4179},
    'Arizona, USA': {'lat': 34.0489, 'lon': -111.0937},
    'Texas, USA': {'lat': 31.9686, 'lon': -99.9018},
    'Florida, USA': {'lat': 27.6648, 'lon': -81.5158},
    'Oregon, USA': {'lat': 43.8041, 'lon': -120.5542},
    'Washington, USA': {'lat': 47.7511, 'lon': -120.7401},
    'Nevada, USA': {'lat': 38.8026, 'lon': -116.4194},
    'New Mexico, USA': {'lat': 34.5199, 'lon': -105.8701},

    # UK
    'London, England, UK': {'lat': 51.5074, 'lon': -0.1278},
    'England, UK': {'lat': 52.3555, 'lon': -1.1743},
    'Shepperton Studios, England': {'lat': 51.3953, 'lon': -0.4462},
    'Pinewood Studios, England': {'lat': 51.5465, 'lon': -0.5365},
    'Edinburgh, Scotland': {'lat': 55.9533, 'lon': -3.1883},
    'Manchester, England, UK': {'lat': 53.4808, 'lon': -2.2426},
    'United Kingdom': {'lat': 55.3781, 'lon': -3.4360},

    # Canada
    'Toronto, Ontario, Canada': {'lat': 43.6532, 'lon': -79.3832},
    'Vancouver, British Columbia, Canada': {'lat': 49.2827, 'lon': -123.1207},
    'British Columbia, Canada': {'lat': 53.7267, 'lon': -127.6476},
    'Montreal, Quebec, Canada': {'lat': 45.5017, 'lon': -73.5673},

    # Europe
    'Paris, France': {'lat': 48.8566, 'lon': 2.3522},
    'Berlin, Germany': {'lat': 52.5200, 'lon': 13.4050},
    'Rome, Italy': {'lat': 41.9028, 'lon': 12.4964},
    'Prague, Czech Republic': {'lat': 50.0755, 'lon': 14.4378},
    'Budapest, Hungary': {'lat': 47.4979, 'lon': 19.0402},
    'Madrid, Spain': {'lat': 40.4168, 'lon': -3.7038},
    'Iceland': {'lat': 64.9631, 'lon': -19.0208},
    'Malta': {'lat': 35.8989, 'lon': 14.5146},

    # Oceania
    'Wellington, New Zealand': {'lat': -41.2865, 'lon': 174.7762},
    'New Zealand': {'lat': -40.9006, 'lon': 174.8860},
    'Sydney, Australia': {'lat': -33.8688, 'lon': 151.2093},
    'Melbourne, Australia': {'lat': -37.8136, 'lon': 144.9631},

    # Asia
    'Tokyo, Japan': {'lat': 35.6762, 'lon': 139.6503},
    'Japan': {'lat': 36.2048, 'lon': 138.2529},
    'Shanghai, China': {'lat': 31.2304, 'lon': 121.4737},
    'Hong Kong': {'lat': 22.3193, 'lon': 114.1694},

    # Africa
    'Cape Town, South Africa': {'lat': -33.9249, 'lon': 18.4241},
    'Johannesburg, South Africa': {'lat': -26.2041, 'lon': 28.0473},

    # Space/Fictional (use symbolic coordinates)
    'Moon': {'lat': 0, 'lon': 0},
    'Mars': {'lat': 0, 'lon': 0},
    'Jupiter': {'lat': 0, 'lon': 0},
    'Deep space': {'lat': 0, 'lon': 0},
    'Outer space': {'lat': 0, 'lon': 0},
    'Space Station': {'lat': 0, 'lon': 0},
    'Pandora': {'lat': 0, 'lon': 0},
    'LV-426': {'lat': 0, 'lon': 0},
    'Titan': {'lat': 0, 'lon': 0},
    'Fictional Locations': {'lat': 0, 'lon': 0},
    'Post-apocalyptic Earth': {'lat': 0, 'lon': 0},
}

def simplify_location(loc_string, is_filming=True):
    """Simplify complex location string to single location."""
    if not loc_string or not loc_string.strip():
        return 'Unknown'

    loc_string = loc_string.strip()

    # Location mapping patterns
    patterns = [
        # Studios
        (r'.*Shepperton Studios.*England', 'Shepperton Studios, England'),
        (r'.*Pinewood Studios.*England', 'Pinewood Studios, England'),
        (r'.*Universal Studios.*', 'Los Angeles, California, USA'),
        (r'.*20th Century Fox.*California', 'Los Angeles, California, USA'),
        (r'.*Cines Studios.*Rome', 'Rome, Italy'),

        # US locations (specific to general)
        (r'.*Los Angeles.*California', 'Los Angeles, California, USA'),
        (r'.*New York.*', 'New York City, New York, USA'),
        (r'.*San Francisco.*', 'San Francisco, California, USA'),
        (r'.*Chicago.*', 'Chicago, Illinois, USA'),
        (r'.*Seattle.*', 'Seattle, Washington, USA'),
        (r'.*Portland.*Oregon', 'Portland, Oregon, USA'),
        (r'.*Atlanta.*', 'Atlanta, Georgia, USA'),
        (r'.*Dallas.*Texas', 'Dallas, Texas, USA'),
        (r'.*Austin.*Texas', 'Austin, Texas, USA'),
        (r'.*Phoenix.*Arizona', 'Phoenix, Arizona, USA'),
        (r'.*Miami.*Florida', 'Miami, Florida, USA'),
        (r'.*Cape Town.*', 'Cape Town, South Africa'),

        # States
        (r'.*California.*USA', 'California, USA'),
        (r'.*Arizona.*USA', 'Arizona, USA'),
        (r'.*Texas.*USA', 'Texas, USA'),
        (r'.*Florida.*USA', 'Florida, USA'),
        (r'.*Oregon.*USA', 'Oregon, USA'),
        (r'.*Washington.*USA', 'Washington, USA'),
        (r'.*New Mexico.*USA', 'New Mexico, USA'),

        # UK
        (r'.*London.*', 'London, England, UK'),
        (r'.*Edinburgh.*', 'Edinburgh, Scotland'),
        (r'.*Manchester.*', 'Manchester, England, UK'),
        (r'.*England.*', 'England, UK'),
        (r'.*United Kingdom', 'United Kingdom'),

        # International
        (r'.*Paris.*', 'Paris, France'),
        (r'.*Berlin.*', 'Berlin, Germany'),
        (r'.*Rome.*', 'Rome, Italy'),
        (r'.*Prague.*', 'Prague, Czech Republic'),
        (r'.*Budapest.*', 'Budapest, Hungary'),
        (r'.*Madrid.*', 'Madrid, Spain'),
        (r'.*Tokyo.*', 'Tokyo, Japan'),
        (r'.*Shanghai.*', 'Shanghai, China'),
        (r'.*Hong Kong', 'Hong Kong'),
        (r'.*Iceland', 'Iceland'),
        (r'.*Malta', 'Malta'),
        (r'.*Wellington.*New Zealand', 'Wellington, New Zealand'),
        (r'.*New Zealand', 'New Zealand'),
        (r'.*Sydney.*', 'Sydney, Australia'),
        (r'.*Melbourne.*', 'Melbourne, Australia'),
        (r'.*Toronto.*', 'Toronto, Ontario, Canada'),
        (r'.*Vancouver.*', 'Vancouver, British Columbia, Canada'),
        (r'.*Montreal.*', 'Montreal, Quebec, Canada'),
        (r'.*British Columbia', 'British Columbia, Canada'),
        (r'.*Johannesburg.*', 'Johannesburg, South Africa'),

        # Space/Fictional (for depicted locations)
        (r'.*\bMoon\b', 'Moon'),
        (r'.*\bMars\b', 'Mars'),
        (r'.*\bJupiter\b', 'Jupiter'),
        (r'.*\bTitan\b', 'Titan'),
        (r'.*Pandora', 'Pandora'),
        (r'.*LV-426', 'LV-426'),
        (r'.*[Dd]eep space', 'Deep space'),
        (r'.*[Oo]uter space', 'Outer space'),
        (r'.*[Ss]pace [Ss]tation', 'Space Station'),
        (r'.*[Ss]paceship', 'Outer space'),
        (r'.*[Pp]ost-apocalyptic', 'Post-apocalyptic Earth'),
        (r'.*[Dd]ystopian.*(?:city|future)', 'Fictional Locations'),
        (r'.*[Ff]ictional', 'Fictional Locations'),
        (r'.*[Ee]xtraterrestrial', 'Fictional Locations'),
    ]

    # Try patterns
    for pattern, mapped_loc in patterns:
        if re.search(pattern, loc_string, re.IGNORECASE):
            return mapped_loc

    # Extract first part if comma/slash separated
    parts = re.split(r'[,;/]', loc_string)
    if parts:
        return parts[0].strip()

    return loc_string

# Load existing data
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'r') as f:
    coords_data = json.load(f)

# Load shelf data
with open('/Users/audreyyang/Downloads/parallax/movies_data_for_shelf.js', 'r') as f:
    js_content = f.read()
    array_start = js_content.find('[')
    array_end = js_content.rfind(']') + 1
    movies = json.loads(js_content[array_start:array_end])

# Get existing movies
existing_movies = set(conn['movie'] for conn in coords_data['connections'])
print(f"Existing movies in coordinates: {len(existing_movies)}")
print(f"Total movies in shelf data: {len(movies)}")

# Process missing movies
new_connections = []
new_coordinates = {}

for movie in movies:
    if movie['title'] not in existing_movies:
        # Simplify locations
        filming = simplify_location(movie['filmingLocation'], is_filming=True)
        depicted = simplify_location(movie['depictedLocation'], is_filming=False)

        # Add connection
        new_connections.append({
            'movie': movie['title'],
            'year': str(movie['year']),
            'from': filming,
            'to': depicted,
            'type': 'filming-to-depicted'
        })

        # Check if we need to add coordinates
        if filming not in coords_data['coordinates'] and filming not in new_coordinates:
            if filming in COORDINATE_DATABASE:
                new_coordinates[filming] = COORDINATE_DATABASE[filming]
            else:
                # Fallback to 0,0 for unknown locations
                new_coordinates[filming] = {'lat': 0, 'lon': 0}
                print(f"⚠️  Unknown filming location: {filming} (from {movie['title']})")

        if depicted not in coords_data['coordinates'] and depicted not in new_coordinates:
            if depicted in COORDINATE_DATABASE:
                new_coordinates[depicted] = COORDINATE_DATABASE[depicted]
            else:
                new_coordinates[depicted] = {'lat': 0, 'lon': 0}
                print(f"⚠️  Unknown depicted location: {depicted} (from {movie['title']})")

print(f"\nAdding {len(new_connections)} new movie connections")
print(f"Adding {len(new_coordinates)} new location coordinates")

# Update data structures
coords_data['connections'].extend(new_connections)
coords_data['coordinates'].update(new_coordinates)

# Write updated file
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'w') as f:
    json.dump(coords_data, f, indent=2)

print(f"\n✓ Updated movie-coordinates.json")
print(f"  Total connections: {len(coords_data['connections'])}")
print(f"  Total locations: {len(coords_data['coordinates'])}")

# Show sample of added movies
print(f"\nSample of added movies:")
for conn in new_connections[:10]:
    print(f"  • {conn['movie']} ({conn['year']})")
    print(f"    {conn['from']} → {conn['to']}")

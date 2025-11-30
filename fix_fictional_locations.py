#!/usr/bin/env python3
"""
Map all fictional/unknown locations (with 0,0 coordinates) to "Fictional Locations"
so they only appear in the solar system view, not on the Earth map.
"""

import json

# Load movie-coordinates.json
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'r') as f:
    coords_data = json.load(f)

# Known solar system bodies (these should keep their 0,0 coordinates)
SOLAR_SYSTEM_BODIES = {
    'Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn',
    'Uranus', 'Neptune', 'Moon', 'Io', 'Europa', 'Ganymede', 'Callisto',
    'Titan', 'Enceladus', 'Pluto'
}

# Find locations with 0,0 coordinates that aren't planets
fictional_locations = []
for loc, coords in coords_data['coordinates'].items():
    if coords['lat'] == 0 and coords['lon'] == 0:
        # Skip if it's a known solar system body
        if loc not in SOLAR_SYSTEM_BODIES:
            # Skip if it's already "Fictional Locations"
            if loc != 'Fictional Locations':
                fictional_locations.append(loc)

print(f"Found {len(fictional_locations)} fictional/unknown locations to consolidate:\n")
for loc in sorted(fictional_locations):
    print(f"  - {loc}")

# Ensure "Fictional Locations" coordinate exists
if 'Fictional Locations' not in coords_data['coordinates']:
    coords_data['coordinates']['Fictional Locations'] = {'lat': 0, 'lon': 0}

# Update all connections that use these fictional locations
updated_connections = 0
for conn in coords_data['connections']:
    if conn['from'] in fictional_locations:
        print(f"  Updating {conn['movie']}: {conn['from']} → Fictional Locations (filming)")
        conn['from'] = 'Fictional Locations'
        updated_connections += 1

    if conn['to'] in fictional_locations:
        print(f"  Updating {conn['movie']}: {conn['to']} → Fictional Locations (depicted)")
        conn['to'] = 'Fictional Locations'
        updated_connections += 1

print(f"\nUpdated {updated_connections} connection references")

# Remove the now-unused fictional location coordinates
for loc in fictional_locations:
    if loc in coords_data['coordinates']:
        del coords_data['coordinates'][loc]

print(f"Removed {len(fictional_locations)} unused location coordinates")

# Verify which locations still have 0,0 coordinates
remaining_zero_coords = []
for loc, coords in coords_data['coordinates'].items():
    if coords['lat'] == 0 and coords['lon'] == 0:
        remaining_zero_coords.append(loc)

print(f"\nLocations with 0,0 coordinates (should only be planets/space + Fictional Locations):")
for loc in sorted(remaining_zero_coords):
    is_planet = loc in SOLAR_SYSTEM_BODIES
    print(f"  {'✓' if is_planet else '⚠'} {loc}")

# Write updated data
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'w') as f:
    json.dump(coords_data, f, indent=2)

print(f"\n✓ Updated movie-coordinates.json")
print(f"  Total connections: {len(coords_data['connections'])}")
print(f"  Total locations: {len(coords_data['coordinates'])}")

# Show summary of what's going to "Fictional Locations"
fictional_count = sum(1 for c in coords_data['connections'] if c['to'] == 'Fictional Locations')
print(f"\n  Movies with fictional depicted locations: {fictional_count}")

#!/usr/bin/env python3
"""
Add Germany and East Germany coordinates, and fix First Spaceship on Venus connection.
"""

import json

# Load movie-coordinates.json
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'r') as f:
    coords_data = json.load(f)

# Add Germany and East Germany coordinates
new_locations = {
    'Germany': {
        'lat': 51.1657,
        'lon': 10.4515,
        'displayName': 'Germany'
    },
    'East Germany': {
        'lat': 52.5200,  # Berlin coordinates (capital of East Germany)
        'lon': 13.4050,
        'displayName': 'East Germany (GDR)'
    }
}

# Add new locations
for loc, coords in new_locations.items():
    if loc not in coords_data['coordinates']:
        coords_data['coordinates'][loc] = coords
        print(f"✓ Added coordinates for: {loc}")
    else:
        print(f"⚠ {loc} already exists")

# Ensure Venus has displayName
if 'Venus' in coords_data['coordinates']:
    if 'displayName' not in coords_data['coordinates']['Venus']:
        coords_data['coordinates']['Venus']['displayName'] = 'Venus (Solar System)'
        print(f"✓ Added displayName to Venus")

# Fix First Spaceship on Venus connection
for conn in coords_data['connections']:
    if conn['movie'] == 'First Spaceship on Venus':
        print(f"\nUpdating First Spaceship on Venus:")
        print(f"  Before: {conn['from']} → {conn['to']}")

        # Update to use proper locations
        conn['from'] = 'East Germany'
        conn['to'] = 'Venus'

        print(f"  After: {conn['from']} → {conn['to']}")
        print(f"  Original: {conn.get('originalFrom', 'N/A')} → {conn.get('originalTo', 'N/A')}")

# Write updated data
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'w') as f:
    json.dump(coords_data, f, indent=2)

print(f"\n✓ Updated movie-coordinates.json")
print(f"  Total locations: {len(coords_data['coordinates'])}")

# Verify Venus is set up correctly
print(f"\nVenus configuration:")
print(f"  Coordinates: {coords_data['coordinates']['Venus']}")

print(f"\nGermany locations:")
for loc in ['Germany', 'East Germany', 'Berlin, Germany']:
    if loc in coords_data['coordinates']:
        print(f"  {loc}: {coords_data['coordinates'][loc]}")

#!/usr/bin/env python3
"""
Clean up movie-coordinates.json:
1. Remove duplicate connections
2. Remove movies not in movies_data_for_shelf.js
3. Remove unused location coordinates
"""

import json

# Load movies_data_for_shelf.js to get valid movie list
with open('/Users/audreyyang/Downloads/parallax/movies_data_for_shelf.js', 'r') as f:
    js_content = f.read()
    array_start = js_content.find('[')
    array_end = js_content.rfind(']') + 1
    shelf_movies = json.loads(js_content[array_start:array_end])

# Get set of valid movie titles
valid_movie_titles = set(m['title'] for m in shelf_movies)
print(f"Valid movies in shelf data: {len(valid_movie_titles)}")

# Load movie-coordinates.json
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'r') as f:
    coords_data = json.load(f)

print(f"\nBefore cleanup:")
print(f"  Connections: {len(coords_data['connections'])}")
print(f"  Locations: {len(coords_data['coordinates'])}")

# Find duplicates
seen_connections = set()
duplicates_found = []
unique_connections = []

for conn in coords_data['connections']:
    # Create a unique key for this connection
    key = (conn['movie'], conn['year'], conn['from'], conn['to'])

    if key in seen_connections:
        duplicates_found.append(conn)
        print(f"  Duplicate: {conn['movie']} ({conn['year']}) - {conn['from']} → {conn['to']}")
    else:
        seen_connections.add(key)
        unique_connections.append(conn)

print(f"\nFound {len(duplicates_found)} duplicate connections")

# Filter to only movies that exist in shelf data
valid_connections = []
removed_movies = []

for conn in unique_connections:
    if conn['movie'] in valid_movie_titles:
        valid_connections.append(conn)
    else:
        removed_movies.append(conn['movie'])

print(f"Removed {len(removed_movies)} movies not in shelf data:")
for movie in sorted(set(removed_movies)):
    print(f"  - {movie}")

# Find which locations are still being used
used_locations = set()
for conn in valid_connections:
    used_locations.add(conn['from'])
    used_locations.add(conn['to'])

# Keep only coordinates for locations that are used
cleaned_coordinates = {
    loc: coords_data['coordinates'][loc]
    for loc in coords_data['coordinates']
    if loc in used_locations
}

unused_locations = set(coords_data['coordinates'].keys()) - used_locations
print(f"\nRemoved {len(unused_locations)} unused locations:")
for loc in sorted(unused_locations)[:20]:
    print(f"  - {loc}")
if len(unused_locations) > 20:
    print(f"  ... and {len(unused_locations) - 20} more")

# Update data
coords_data['connections'] = valid_connections
coords_data['coordinates'] = cleaned_coordinates

# Write cleaned data
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'w') as f:
    json.dump(coords_data, f, indent=2)

print(f"\nAfter cleanup:")
print(f"  Connections: {len(coords_data['connections'])}")
print(f"  Locations: {len(coords_data['coordinates'])}")

print(f"\n✓ Cleaned up movie-coordinates.json")

# Verify all shelf movies are present
shelf_titles_in_coords = set(conn['movie'] for conn in coords_data['connections'])
missing_from_coords = valid_movie_titles - shelf_titles_in_coords

if missing_from_coords:
    print(f"\n⚠️  WARNING: {len(missing_from_coords)} movies from shelf are missing from coordinates:")
    for title in sorted(missing_from_coords)[:10]:
        print(f"  - {title}")
else:
    print(f"\n✓ All {len(valid_movie_titles)} movies from shelf data are in coordinates")

# Check for connections pointing to movies not in shelf
coords_titles = set(conn['movie'] for conn in coords_data['connections'])
extra_in_coords = coords_titles - valid_movie_titles

if extra_in_coords:
    print(f"\n⚠️  WARNING: {len(extra_in_coords)} movies in coordinates not in shelf data:")
    for title in sorted(extra_in_coords)[:10]:
        print(f"  - {title}")
else:
    print(f"\n✓ No extra movies in coordinates")

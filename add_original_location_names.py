#!/usr/bin/env python3
"""
Add originalFrom and originalTo fields to connections to preserve
the actual location names for display in popups, while keeping
"Fictional Locations" for coordinate lookups.
"""

import json

# Load movies_data_for_shelf.js to get original location names
with open('/Users/audreyyang/Downloads/parallax/movies_data_for_shelf.js', 'r') as f:
    js_content = f.read()
    array_start = js_content.find('[')
    array_end = js_content.rfind(']') + 1
    shelf_movies = json.loads(js_content[array_start:array_end])

# Create a mapping of movie title to original locations
movie_to_original_locs = {}
for movie in shelf_movies:
    movie_to_original_locs[movie['title']] = {
        'filming': movie.get('filmingLocation', ''),
        'depicted': movie.get('depictedLocation', '')
    }

# Load movie-coordinates.json
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'r') as f:
    coords_data = json.load(f)

print(f"Adding original location names to connections...")

# Update connections to include original names
updated_count = 0
for conn in coords_data['connections']:
    movie_title = conn['movie']

    if movie_title in movie_to_original_locs:
        original_locs = movie_to_original_locs[movie_title]

        # Add original names for display
        conn['originalFrom'] = original_locs['filming']
        conn['originalTo'] = original_locs['depicted']

        updated_count += 1

print(f"✓ Updated {updated_count} connections with original location names")

# Show some examples
print(f"\nSample connections with original names:")
for i, conn in enumerate(coords_data['connections'][:10]):
    print(f"\n{i+1}. {conn['movie']} ({conn['year']})")
    print(f"   Coordinates: {conn['from']} → {conn['to']}")
    if 'originalFrom' in conn:
        print(f"   Display: {conn['originalFrom']} → {conn['originalTo']}")

# Write updated data
with open('/Users/audreyyang/Downloads/parallax/movie-coordinates.json', 'w') as f:
    json.dump(coords_data, f, indent=2)

print(f"\n✓ Updated movie-coordinates.json with original location names")
print(f"  Total connections: {len(coords_data['connections'])}")

# Show examples of fictional locations
fictional_count = 0
print(f"\nExamples of fictional locations with preserved names:")
for conn in coords_data['connections']:
    if conn['to'] == 'Fictional Locations' and 'originalTo' in conn:
        print(f"  • {conn['movie']}: {conn['originalTo']}")
        fictional_count += 1
        if fictional_count >= 10:
            break

print(f"\nTotal fictional depicted locations: {sum(1 for c in coords_data['connections'] if c['to'] == 'Fictional Locations')}")

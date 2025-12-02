#!/usr/bin/env python3
"""
Cross-check movies between movie-coordinates.json and movies_data_for_shelf.js
to ensure every movie in coordinates has a corresponding entry in the shelf data.
"""

import json
import sys
import re
from collections import defaultdict

def normalize_movie_name(name):
    """Normalize movie name for comparison (lowercase, strip whitespace, normalize apostrophes and dashes)"""
    if not name:
        return ""
    # Replace curly apostrophes/quotes with straight ones
    normalized = name.replace('\u2019', "'")  # Right single quotation mark
    normalized = normalized.replace('\u2018', "'")  # Left single quotation mark
    normalized = normalized.replace('\u201C', '"')  # Left double quotation mark
    normalized = normalized.replace('\u201D', '"')  # Right double quotation mark
    # Replace em dashes and en dashes with regular hyphens
    normalized = normalized.replace('\u2014', '-')  # Em dash
    normalized = normalized.replace('\u2013', '-')  # En dash
    return normalized.strip().lower()

def load_coordinates_movies():
    """Load all unique movies from movie-coordinates.json"""
    try:
        with open('movie-coordinates.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        movies = set()
        movies_by_name = defaultdict(list)
        
        for conn in data.get('connections', []):
            movie = conn.get('movie', '').strip()
            if movie:
                movies.add(normalize_movie_name(movie))
                movies_by_name[normalize_movie_name(movie)].append({
                    'movie': movie,
                    'year': conn.get('year', ''),
                    'from': conn.get('from', ''),
                    'to': conn.get('to', '')
                })
        
        return movies, movies_by_name
    except Exception as e:
        print(f"Error loading movie-coordinates.json: {e}")
        sys.exit(1)

def load_shelf_movies():
    """Load all unique movies from movies_data_for_shelf.js"""
    try:
        movies = set()
        movies_by_name = {}
        
        with open('movies_data_for_shelf.js', 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Remove the export statement if present
            content = re.sub(r'export\s+default\s+data\s*;?\s*$', '', content, flags=re.MULTILINE)
            
            # Extract the array content - find everything between [ and ] but handle nested arrays
            # Find the data = [...] pattern
            match = re.search(r'(?:const|var|let)?\s*data\s*=\s*\[', content, re.DOTALL)
            if match:
                # Find the matching closing bracket
                start_pos = match.end() - 1  # Position of the opening [
                bracket_count = 0
                i = start_pos
                while i < len(content):
                    if content[i] == '[':
                        bracket_count += 1
                    elif content[i] == ']':
                        bracket_count -= 1
                        if bracket_count == 0:
                            # Found the matching closing bracket
                            array_content = content[start_pos:i+1]
                            try:
                                data = json.loads(array_content)
                                for item in data:
                                    # Try different possible field names for title
                                    title = None
                                    for field in ['title', 'movie', 'name', 'Title', 'Movie', 'Name']:
                                        if field in item and item[field]:
                                            title = item[field]
                                            break
                                    
                                    if title:
                                        normalized = normalize_movie_name(str(title))
                                        movies.add(normalized)
                                        if normalized not in movies_by_name:
                                            movies_by_name[normalized] = {
                                                'original': title,
                                                'year': item.get('year', item.get('Year', '')),
                                                'data': item
                                            }
                                break
                            except json.JSONDecodeError as e:
                                print(f"Warning: Could not parse array content: {e}")
                                # Try a simpler approach - extract individual title fields
                                title_matches = re.findall(r'"title"\s*:\s*"([^"]+)"', array_content)
                                for title in title_matches:
                                    normalized = normalize_movie_name(title)
                                    movies.add(normalized)
                                    if normalized not in movies_by_name:
                                        movies_by_name[normalized] = {
                                            'original': title,
                                            'year': '',
                                            'data': {}
                                        }
                            break
                    i += 1
        
        return movies, movies_by_name
    except Exception as e:
        print(f"Error loading movies_data_for_shelf.js: {e}")
        import traceback
        traceback.print_exc()
        return set(), {}

def find_similar_names(target_name, candidate_names, threshold=0.8):
    """Find similar movie names using simple string similarity"""
    from difflib import SequenceMatcher
    
    similar = []
    for candidate in candidate_names:
        ratio = SequenceMatcher(None, target_name, candidate).ratio()
        if ratio >= threshold:
            similar.append((candidate, ratio))
    
    return sorted(similar, key=lambda x: x[1], reverse=True)

def main():
    print("=" * 80)
    print("Movie Cross-Check: movie-coordinates.json vs movies_data_for_shelf.js")
    print("=" * 80)
    
    # Load movies from coordinates
    print("\n1. Loading movies from movie-coordinates.json...")
    coord_movies, coord_movies_by_name = load_coordinates_movies()
    print(f"   Found {len(coord_movies)} unique movies in coordinates")
    
    # Load movies from shelf
    print("\n2. Loading movies from movies_data_for_shelf.js...")
    shelf_movies, shelf_movies_by_name = load_shelf_movies()
    print(f"   Found {len(shelf_movies)} unique movies in shelf data")
    
    # Find movies in coordinates but not in shelf
    print("\n" + "=" * 80)
    print("3. Checking for movies in coordinates that are MISSING from shelf data:")
    print("=" * 80)
    
    missing = coord_movies - shelf_movies
    missing_with_details = []
    
    if missing:
        print(f"\n❌ Found {len(missing)} movies in coordinates but NOT in shelf data:\n")
        for missing_movie in sorted(missing):
            # Get original name from coordinates
            coord_details = coord_movies_by_name.get(missing_movie, [])
            if coord_details:
                original_name = coord_details[0]['movie']
                print(f"   • {original_name}")
                # Try to find similar names
                similar = find_similar_names(missing_movie, shelf_movies, threshold=0.7)
                if similar:
                    print(f"     Possible matches:")
                    for sim_name, ratio in similar[:3]:
                        sim_original = shelf_movies_by_name.get(sim_name, {}).get('original', sim_name)
                        print(f"       - {sim_original} (similarity: {ratio:.2%})")
                print()
                missing_with_details.append({
                    'normalized': missing_movie,
                    'original': original_name,
                    'details': coord_details,
                    'similar': similar[:3] if similar else []
                })
    else:
        print("\n✅ All movies in coordinates have matches in shelf data!")
    
    # Find movies in shelf but not in coordinates (for reference)
    print("\n" + "=" * 80)
    print("4. Movies in shelf data but NOT in coordinates (for reference):")
    print("=" * 80)
    
    extra = shelf_movies - coord_movies
    if extra:
        print(f"\n   Found {len(extra)} movies in shelf data but not in coordinates")
        print("   (This is normal - not all movies may have coordinate data)\n")
        # Show first 10 as examples
        for i, extra_movie in enumerate(sorted(extra)[:10]):
            original = shelf_movies_by_name.get(extra_movie, {}).get('original', extra_movie)
            print(f"   • {original}")
        if len(extra) > 10:
            print(f"   ... and {len(extra) - 10} more")
    else:
        print("\n   No extra movies found")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Movies in coordinates: {len(coord_movies)}")
    print(f"Movies in shelf data: {len(shelf_movies)}")
    print(f"Missing from shelf data: {len(missing)}")
    print(f"Extra in shelf data: {len(extra)}")
    
    if missing:
        print(f"\n⚠️  ACTION REQUIRED: {len(missing)} movies need to be added to shelf data")
        return 1
    else:
        print("\n✅ All movies match!")
        return 0

if __name__ == '__main__':
    sys.exit(main())


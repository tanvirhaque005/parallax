#!/usr/bin/env python3
"""
Cross-check movies between movie-coordinates.json and movies data files
to ensure every movie in coordinates has a corresponding entry in the movies data.
"""

import json
import csv
import sys
from collections import defaultdict

def normalize_movie_name(name):
    """Normalize movie name for comparison (lowercase, strip whitespace, normalize apostrophes)"""
    if not name:
        return ""
    # Replace curly apostrophes/quotes with straight ones
    normalized = name.replace('\u2019', "'")  # Right single quotation mark
    normalized = normalized.replace('\u2018', "'")  # Left single quotation mark
    normalized = normalized.replace('\u201C', '"')  # Left double quotation mark
    normalized = normalized.replace('\u201D', '"')  # Right double quotation mark
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

def load_csv_movies():
    """Load all unique movies from merged_movies_data.csv"""
    try:
        movies = set()
        movies_by_name = {}
        
        with open('merged_movies_data.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Try different possible column names
                movie_name = None
                for col in ['Movie / TV Show Name', 'Movie/TV Show Name', 'Movie', 'Title', 'title']:
                    if col in row and row[col]:
                        movie_name = row[col].strip()
                        break
                
                if movie_name:
                    normalized = normalize_movie_name(movie_name)
                    movies.add(normalized)
                    if normalized not in movies_by_name:
                        movies_by_name[normalized] = {
                            'original': movie_name,
                            'year': row.get('Year', ''),
                            'row': row
                        }
        
        return movies, movies_by_name
    except Exception as e:
        print(f"Error loading merged_movies_data.csv: {e}")
        return set(), {}

def load_js_movies():
    """Load all unique movies from movies_data_for_map.js"""
    try:
        movies = set()
        movies_by_name = {}
        
        with open('movies_data_for_map.js', 'r', encoding='utf-8') as f:
            content = f.read()
            # Try to parse as JSON array (if it's just the data array)
            # Or extract the data array from the JS file
            import re
            # Look for array pattern: data = [...]
            match = re.search(r'data\s*=\s*\[(.*?)\]', content, re.DOTALL)
            if match:
                # Try to parse the array content
                array_content = '[' + match.group(1) + ']'
                try:
                    data = json.loads(array_content)
                    for item in data:
                        title = item.get('title', '').strip()
                        if title:
                            normalized = normalize_movie_name(title)
                            movies.add(normalized)
                            if normalized not in movies_by_name:
                                movies_by_name[normalized] = {
                                    'original': title,
                                    'year': item.get('year', ''),
                                    'data': item
                                }
                except json.JSONDecodeError:
                    print("Warning: Could not parse movies_data_for_map.js as JSON")
        
        return movies, movies_by_name
    except Exception as e:
        print(f"Error loading movies_data_for_map.js: {e}")
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
    print("Movie Cross-Check: movie-coordinates.json vs Movies Data Files")
    print("=" * 80)
    
    # Load movies from coordinates
    print("\n1. Loading movies from movie-coordinates.json...")
    coord_movies, coord_movies_by_name = load_coordinates_movies()
    print(f"   Found {len(coord_movies)} unique movies in coordinates")
    
    # Load movies from CSV
    print("\n2. Loading movies from merged_movies_data.csv...")
    csv_movies, csv_movies_by_name = load_csv_movies()
    print(f"   Found {len(csv_movies)} unique movies in CSV")
    
    # Load movies from JS
    print("\n3. Loading movies from movies_data_for_map.js...")
    js_movies, js_movies_by_name = load_js_movies()
    print(f"   Found {len(js_movies)} unique movies in JS file")
    
    # Combine all movies data sources
    all_data_movies = csv_movies | js_movies
    all_data_movies_by_name = {**csv_movies_by_name, **js_movies_by_name}
    
    print(f"\n   Combined: {len(all_data_movies)} unique movies in data files")
    
    # Find movies in coordinates but not in data files
    print("\n" + "=" * 80)
    print("4. Checking for movies in coordinates that are MISSING from data files:")
    print("=" * 80)
    
    missing = coord_movies - all_data_movies
    missing_with_details = []
    
    if missing:
        print(f"\n❌ Found {len(missing)} movies in coordinates but NOT in data files:\n")
        for missing_movie in sorted(missing):
            # Get original name from coordinates
            coord_details = coord_movies_by_name.get(missing_movie, [])
            if coord_details:
                original_name = coord_details[0]['movie']
                print(f"   • {original_name}")
                # Try to find similar names
                similar = find_similar_names(missing_movie, all_data_movies, threshold=0.7)
                if similar:
                    print(f"     Possible matches:")
                    for sim_name, ratio in similar[:3]:
                        sim_original = all_data_movies_by_name.get(sim_name, {}).get('original', sim_name)
                        print(f"       - {sim_original} (similarity: {ratio:.2%})")
                print()
                missing_with_details.append({
                    'normalized': missing_movie,
                    'original': original_name,
                    'details': coord_details,
                    'similar': similar[:3] if similar else []
                })
    else:
        print("\n✅ All movies in coordinates have matches in data files!")
    
    # Find movies in data files but not in coordinates (for reference)
    print("\n" + "=" * 80)
    print("5. Movies in data files but NOT in coordinates (for reference):")
    print("=" * 80)
    
    extra = all_data_movies - coord_movies
    if extra:
        print(f"\n   Found {len(extra)} movies in data files but not in coordinates")
        print("   (This is normal - not all movies may have coordinate data)\n")
        # Show first 10 as examples
        for i, extra_movie in enumerate(sorted(extra)[:10]):
            original = all_data_movies_by_name.get(extra_movie, {}).get('original', extra_movie)
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
    print(f"Movies in data files: {len(all_data_movies)}")
    print(f"Missing from data files: {len(missing)}")
    print(f"Extra in data files: {len(extra)}")
    
    if missing:
        print(f"\n⚠️  ACTION REQUIRED: {len(missing)} movies need to be added to data files")
        return 1
    else:
        print("\n✅ All movies match!")
        return 0

if __name__ == '__main__':
    sys.exit(main())


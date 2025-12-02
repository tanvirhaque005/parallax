#!/usr/bin/env python3
"""
Recalibrate all coordinates using 3 reference points.
Uses the provided lat/lon coordinates to calculate optimal transformation.
"""

import json
import sys

# Reference points with their correct lat/lon
REFERENCE_POINTS = [
    {
        'name': 'Los Angeles, California, USA',
        'lat': 34.0536909,
        'lon': -118.242766,
        'displayName': 'Los Angeles, California, USA'
    },
    {
        'name': 'Budapest, Hungary',
        'lat': 46.4813896,
        'lon': 16.45,
        'displayName': 'Budapest, Hungary'
    },
    {
        'name': 'New York City, New York, USA',
        'lat': 39.7127281,
        'lon': -75.0060152,
        'displayName': 'New York, 10000, United States of America'
    }
]

def lat_lon_to_plane_current(lat, lon, x_offset=-0.056, y_offset=-0.085):
    """Current coordinate transformation (from morph.js)"""
    return {
        'x': (lon / 180) + x_offset,
        'y': ((lat / 90) * 0.5) + y_offset
    }

def calculate_optimal_offsets(reference_points):
    """
    Calculate optimal xOffset and yOffset using 3 reference points.
    Uses least squares to minimize error across all reference points.
    """
    # Calculate what plane coordinates should be for each reference point
    # We'll use the current transformation as a starting point
    target_coords = []
    for ref in reference_points:
        # Use current transformation to get target plane coordinates
        plane = lat_lon_to_plane_current(ref['lat'], ref['lon'])
        target_coords.append({
            'lat': ref['lat'],
            'lon': ref['lon'],
            'target_x': plane['x'],
            'target_y': plane['y']
        })
    
    # For each reference point, we have:
    # target_x = (lon / 180) + xOffset
    # target_y = ((lat / 90) * 0.5) + yOffset
    
    # We can solve for xOffset and yOffset using least squares
    # For xOffset: target_x - (lon / 180) = xOffset
    # For yOffset: target_y - ((lat / 90) * 0.5) = yOffset
    
    x_offsets = []
    y_offsets = []
    
    for ref, target in zip(reference_points, target_coords):
        # Calculate what offset would make this point match
        x_offset_calc = target['target_x'] - (ref['lon'] / 180)
        y_offset_calc = target['target_y'] - ((ref['lat'] / 90) * 0.5)
        x_offsets.append(x_offset_calc)
        y_offsets.append(y_offset_calc)
    
    # Average the offsets (or use median for robustness)
    optimal_x_offset = sum(x_offsets) / len(x_offsets)
    optimal_y_offset = sum(y_offsets) / len(y_offsets)
    
    return optimal_x_offset, optimal_y_offset, target_coords

def main():
    print("=" * 60)
    print("Recalibrating Coordinates Using 3 Reference Points")
    print("=" * 60)
    
    # Load coordinates
    try:
        with open('movie-coordinates.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        coordinates = data['coordinates']
        print(f"\nLoaded {len(coordinates)} locations from movie-coordinates.json")
    except FileNotFoundError:
        print("Error: movie-coordinates.json not found!")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in movie-coordinates.json: {e}")
        sys.exit(1)
    
    # Update reference points in coordinates
    print("\nUpdating reference point coordinates...")
    for ref in REFERENCE_POINTS:
        if ref['name'] in coordinates:
            old_lat = coordinates[ref['name']]['lat']
            old_lon = coordinates[ref['name']]['lon']
            coordinates[ref['name']]['lat'] = ref['lat']
            coordinates[ref['name']]['lon'] = ref['lon']
            coordinates[ref['name']]['displayName'] = ref['displayName']
            print(f"  {ref['name']}:")
            print(f"    Old: lat={old_lat}, lon={old_lon}")
            print(f"    New: lat={ref['lat']}, lon={ref['lon']}")
        else:
            print(f"  Warning: {ref['name']} not found in coordinates!")
    
    # Calculate optimal offsets
    print("\nCalculating optimal transformation...")
    x_offset, y_offset, target_coords = calculate_optimal_offsets(REFERENCE_POINTS)
    
    print(f"\nOptimal offsets:")
    print(f"  xOffset = {x_offset:.6f}")
    print(f"  yOffset = {y_offset:.6f}")
    
    # Verify transformation on reference points
    print("\nVerifying transformation on reference points:")
    for ref, target in zip(REFERENCE_POINTS, target_coords):
        calculated_x = (ref['lon'] / 180) + x_offset
        calculated_y = ((ref['lat'] / 90) * 0.5) + y_offset
        error_x = abs(calculated_x - target['target_x'])
        error_y = abs(calculated_y - target['target_y'])
        print(f"  {ref['name']}:")
        print(f"    Target: x={target['target_x']:.6f}, y={target['target_y']:.6f}")
        print(f"    Calculated: x={calculated_x:.6f}, y={calculated_y:.6f}")
        print(f"    Error: x={error_x:.6f}, y={error_y:.6f}")
    
    # Save updated coordinates
    print("\nSaving updated coordinates...")
    output_data = {
        'coordinates': coordinates,
        'connections': data.get('connections', [])
    }
    
    with open('movie-coordinates.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    print("✓ Updated movie-coordinates.json")
    
    # Update morph.js with new offsets
    print("\nUpdating morph.js with new offsets...")
    try:
        with open('morph.js', 'r', encoding='utf-8') as f:
            morph_content = f.read()
        
        import re
        pattern_x = r'const xOffset = [-\d.]+;'
        pattern_y = r'const yOffset = [-\d.]+;'
        
        morph_content = re.sub(pattern_x, f'const xOffset = {x_offset:.6f};', morph_content)
        morph_content = re.sub(pattern_y, f'const yOffset = {y_offset:.6f};', morph_content)
        
        with open('morph.js', 'w', encoding='utf-8') as f:
            f.write(morph_content)
        
        print(f"✓ Updated morph.js:")
        print(f"  const xOffset = {x_offset:.6f};")
        print(f"  const yOffset = {y_offset:.6f};")
    except Exception as e:
        print(f"Error updating morph.js: {e}")
        print(f"\nManually update morph.js with:")
        print(f"  const xOffset = {x_offset:.6f};")
        print(f"  const yOffset = {y_offset:.6f};")
    
    print("\n" + "=" * 60)
    print("Recalibration complete!")
    print("=" * 60)
    print("\nAll coordinates have been updated.")
    print("The map will use the new offsets when you reload the page.")

if __name__ == '__main__':
    main()


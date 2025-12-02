#!/usr/bin/env python3
"""
Recalibrate map coordinates using 2 reference points.

This script allows you to provide 2 locations with their desired plane coordinates,
then calculates a transformation to adjust all other coordinates accordingly.
"""

import json
import sys
import math

def lat_lon_to_plane_current(lat, lon, x_offset=-0.056, y_offset=-0.085):
    """Current coordinate transformation (from morph.js)"""
    return {
        'x': (lon / 180) + x_offset,
        'y': ((lat / 90) * 0.5) + y_offset
    }

def calculate_transformation(ref_points):
    """
    Calculate transformation from 2 reference points.
    
    ref_points: list of dicts with keys: 'lat', 'lon', 'target_x', 'target_y'
    
    Returns: transformation function that takes (lat, lon) and returns (x, y)
    """
    if len(ref_points) != 2:
        raise ValueError("Need exactly 2 reference points")
    
    p1, p2 = ref_points
    
    # Current positions using current transformation
    curr1 = lat_lon_to_plane_current(p1['lat'], p1['lon'])
    curr2 = lat_lon_to_plane_current(p2['lat'], p2['lon'])
    
    # Target positions
    tgt1 = {'x': p1['target_x'], 'y': p1['target_y']}
    tgt2 = {'x': p2['target_x'], 'y': p2['target_y']}
    
    # Calculate differences
    curr_dx = curr2['x'] - curr1['x']
    curr_dy = curr2['y'] - curr1['y']
    tgt_dx = tgt2['x'] - tgt1['x']
    tgt_dy = tgt2['y'] - tgt1['y']
    
    # Calculate scale factors (separate for x and y to allow non-uniform scaling)
    if abs(curr_dx) < 1e-10:
        scale_x = 1.0
    else:
        scale_x = tgt_dx / curr_dx
    
    if abs(curr_dy) < 1e-10:
        scale_y = 1.0
    else:
        scale_y = tgt_dy / curr_dy
    
    # Calculate translation (after scaling)
    # We want: target = scale * (current - ref1) + ref1 + translation
    # So: translation = target - scale * (current - ref1) - ref1
    # Simplifying: translation = target - scale * current + scale * ref1 - ref1
    trans_x = tgt1['x'] - scale_x * curr1['x']
    trans_y = tgt1['y'] - scale_y * curr1['y']
    
    print(f"Transformation parameters:")
    print(f"  Scale X: {scale_x:.6f}")
    print(f"  Scale Y: {scale_y:.6f}")
    print(f"  Translation X: {trans_x:.6f}")
    print(f"  Translation Y: {trans_y:.6f}")
    
    def transform(lat, lon):
        # Get current position
        curr = lat_lon_to_plane_current(lat, lon)
        # Apply transformation
        new_x = scale_x * curr['x'] + trans_x
        new_y = scale_y * curr['y'] + trans_y
        return {'x': new_x, 'y': new_y}
    
    return transform

def find_location_by_name(coordinates, name):
    """Find a location in coordinates by name (case-insensitive partial match)"""
    name_lower = name.lower()
    matches = []
    for loc_name, data in coordinates.items():
        if name_lower in loc_name.lower() or loc_name.lower() in name_lower:
            matches.append((loc_name, data))
    
    if len(matches) == 0:
        return None, None
    elif len(matches) == 1:
        return matches[0]
    else:
        print(f"\nMultiple matches found for '{name}':")
        for i, (loc_name, data) in enumerate(matches):
            print(f"  {i+1}. {loc_name} (lat: {data['lat']}, lon: {data['lon']})")
        choice = input(f"Enter number (1-{len(matches)}): ").strip()
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(matches):
                return matches[idx]
        except:
            pass
        return matches[0]  # Default to first

def main():
    print("=" * 60)
    print("Map Coordinate Recalibration Tool")
    print("=" * 60)
    print("\nThis tool will help you recalibrate coordinates using 2 reference points.")
    print("You'll provide the desired plane coordinates for 2 locations,")
    print("and the script will calculate a transformation for all other coordinates.\n")
    
    # Load coordinates
    try:
        with open('movie-coordinates.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        coordinates = data['coordinates']
        print(f"Loaded {len(coordinates)} locations from movie-coordinates.json\n")
    except FileNotFoundError:
        print("Error: movie-coordinates.json not found!")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in movie-coordinates.json: {e}")
        sys.exit(1)
    
    # Get reference points
    ref_points = []
    
    for i in range(2):
        print(f"\n--- Reference Point {i+1} ---")
        name = input("Enter location name (or 'lat,lon' for coordinates): ").strip()
        
        if ',' in name and name.replace('.', '').replace('-', '').replace(',', '').replace(' ', '').isdigit():
            # Direct coordinates provided
            parts = name.split(',')
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            loc_name = f"Custom_{i+1}"
            print(f"Using coordinates: lat={lat}, lon={lon}")
        else:
            # Find by name
            loc_name, loc_data = find_location_by_name(coordinates, name)
            if loc_name is None:
                print(f"Error: Location '{name}' not found!")
                sys.exit(1)
            lat = loc_data['lat']
            lon = loc_data['lon']
            print(f"Found: {loc_name} (lat: {lat}, lon: {lon})")
        
        print(f"\nCurrent plane coordinates for this location:")
        curr = lat_lon_to_plane_current(lat, lon)
        print(f"  X: {curr['x']:.6f}, Y: {curr['y']:.6f}")
        
        target_x = float(input("Enter desired X coordinate: ").strip())
        target_y = float(input("Enter desired Y coordinate: ").strip())
        
        ref_points.append({
            'name': loc_name,
            'lat': lat,
            'lon': lon,
            'target_x': target_x,
            'target_y': target_y
        })
    
    # Calculate transformation
    print("\n" + "=" * 60)
    print("Calculating transformation...")
    transform = calculate_transformation(ref_points)
    
    # Verify transformation on reference points
    print("\nVerifying transformation on reference points:")
    for ref in ref_points:
        result = transform(ref['lat'], ref['lon'])
        print(f"  {ref['name']}:")
        print(f"    Target: X={ref['target_x']:.6f}, Y={ref['target_y']:.6f}")
        print(f"    Result: X={result['x']:.6f}, Y={result['y']:.6f}")
        error_x = abs(result['x'] - ref['target_x'])
        error_y = abs(result['y'] - ref['target_y'])
        print(f"    Error:  X={error_x:.6f}, Y={error_y:.6f}")
    
    # Ask if user wants to update the offsets in morph.js or create new coordinates
    print("\n" + "=" * 60)
    print("What would you like to do?")
    print("1. Update the xOffset and yOffset in morph.js (keeps lat/lon, adjusts transformation)")
    print("2. Create a new coordinate mapping file (stores transformed x,y directly)")
    print("3. Just show me the new offsets to use")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        # Calculate new offsets
        # We need to find offsets such that: new_x = (lon/180) + new_xOffset
        # and new_y = ((lat/90)*0.5) + new_yOffset
        # But we want: transform(lat, lon) = scale * old + translation
        
        # For a single reference point, we can solve:
        # target_x = scale_x * ((lon/180) + old_xOffset) + trans_x
        # target_x = scale_x * (lon/180) + scale_x * old_xOffset + trans_x
        # So: new_xOffset = scale_x * old_xOffset + trans_x
        
        # Actually, let's use one of the reference points to solve for the offset
        ref = ref_points[0]
        result = transform(ref['lat'], ref['lon'])
        
        # We want: result_x = (ref['lon']/180) + new_xOffset
        # So: new_xOffset = result_x - (ref['lon']/180)
        new_x_offset = result['x'] - (ref['lon'] / 180)
        new_y_offset = result['y'] - ((ref['lat'] / 90) * 0.5)
        
        print(f"\nNew offsets to use in morph.js:")
        print(f"  const xOffset = {new_x_offset:.6f};")
        print(f"  const yOffset = {new_y_offset:.6f};")
        
        update = input("\nUpdate morph.js with these offsets? (y/n): ").strip().lower()
        if update == 'y':
            # Read morph.js
            try:
                with open('morph.js', 'r', encoding='utf-8') as f:
                    morph_content = f.read()
                
                # Replace the offset values
                import re
                pattern_x = r'const xOffset = [-\d.]+;'
                pattern_y = r'const yOffset = [-\d.]+;'
                
                morph_content = re.sub(pattern_x, f'const xOffset = {new_x_offset:.6f};', morph_content)
                morph_content = re.sub(pattern_y, f'const yOffset = {new_y_offset:.6f};', morph_content)
                
                # Write back
                with open('morph.js', 'w', encoding='utf-8') as f:
                    f.write(morph_content)
                
                print("✓ Updated morph.js with new offsets!")
            except Exception as e:
                print(f"Error updating morph.js: {e}")
    
    elif choice == '2':
        # Create new coordinate mapping
        output_file = input("Enter output filename (default: movie-coordinates-recalibrated.json): ").strip()
        if not output_file:
            output_file = 'movie-coordinates-recalibrated.json'
        
        # Transform all coordinates
        new_coordinates = {}
        for loc_name, loc_data in coordinates.items():
            if 'lat' in loc_data and 'lon' in loc_data:
                # Only transform if it has lat/lon (skip solar system bodies with 0,0)
                if loc_data['lat'] != 0 or loc_data['lon'] != 0:
                    transformed = transform(loc_data['lat'], loc_data['lon'])
                    new_coordinates[loc_name] = {
                        **loc_data,
                        'plane_x': transformed['x'],
                        'plane_y': transformed['y']
                    }
                else:
                    new_coordinates[loc_name] = loc_data
            else:
                new_coordinates[loc_name] = loc_data
        
        # Save
        output_data = {
            'coordinates': new_coordinates,
            'connections': data.get('connections', [])
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✓ Created {output_file} with transformed coordinates!")
        print(f"  Note: This adds 'plane_x' and 'plane_y' fields to each coordinate.")
        print(f"  You'll need to update morph.js to use these instead of calculating from lat/lon.")
    
    else:  # choice == '3' or default
        # Just show offsets
        ref = ref_points[0]
        result = transform(ref['lat'], ref['lon'])
        new_x_offset = result['x'] - (ref['lon'] / 180)
        new_y_offset = result['y'] - ((ref['lat'] / 90) * 0.5)
        
        print(f"\nNew offsets to use in morph.js:")
        print(f"  const xOffset = {new_x_offset:.6f};")
        print(f"  const yOffset = {new_y_offset:.6f};")
        print(f"\nUpdate the latLonToPlane function in morph.js with these values.")

if __name__ == '__main__':
    main()


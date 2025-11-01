#!/usr/bin/env python3
"""
NDVI data processing script
Converts raw NDVI TIFF files to processed formats for web application
"""

import rasterio
import numpy as np
from pathlib import Path
import json
import argparse
from datetime import datetime
import os

def check_file_integrity(file_path: Path) -> bool:
    """Quick integrity check for TIFF files with retry logic"""
    import time
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with rasterio.open(file_path) as dataset:
                # Try to read basic metadata
                _ = dataset.bounds
                _ = dataset.crs
                _ = dataset.width
                _ = dataset.height
                # Try to read a small sample of data
                sample = dataset.read(1, window=((0, min(10, dataset.height)), 
                                               (0, min(10, dataset.width))))
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"    Retry {attempt + 1}/{max_retries} after error: {str(e)[:50]}...")
                time.sleep(0.5)  # Brief pause before retry
                continue
            else:
                print(f"    Final attempt failed: {str(e)[:100]}")
                return False
    return False

def validate_geographic_bounds(dataset) -> bool:
    """Validate that the dataset covers the required Tenggeli Desert area"""
    bounds = dataset.bounds
    
    # Required bounds: 103°-105.2°E, 37.5°-39.0°N (actual data coverage)
    required_west, required_south = 103.0, 37.5
    required_east, required_north = 105.2, 39.0
    
    # Check if dataset bounds overlap with required area
    overlaps = (bounds.left < required_east and bounds.right > required_west and
                bounds.bottom < required_north and bounds.top > required_south)
    
    if not overlaps:
        print(f"  ⚠ Dataset bounds {bounds} do not overlap with required Tenggeli area")
        return False
    
    return True

def process_tiff_to_web_tiles(input_file: Path, output_dir: Path, tile_size: int = 256):
    """Process TIFF file into web-friendly tiles"""
    try:
        with rasterio.open(input_file) as dataset:
            # Validate geographic bounds
            if not validate_geographic_bounds(dataset):
                return False, None
                
            data = dataset.read(1)
            
            # Create output directory - filter to 2015-2024 range
            year_month = input_file.stem.split('_')[2:4]
            year = int(year_month[0])
            
            # Skip data outside 2015-2024 range as per CLAUDE.md requirements
            if year < 2015 or year > 2024:
                print(f"  ⚠ Skipping {year} - outside required 2015-2024 range")
                return False, None
                
            tile_dir = output_dir / f"{year_month[0]}_{year_month[1]}"
            tile_dir.mkdir(parents=True, exist_ok=True)
            
            # Basic statistics
            valid_data = data[(data >= -1) & (data <= 1) & (~np.isnan(data))]
            stats = {
                'min': float(np.min(valid_data)) if len(valid_data) > 0 else None,
                'max': float(np.max(valid_data)) if len(valid_data) > 0 else None,
                'mean': float(np.mean(valid_data)) if len(valid_data) > 0 else None,
                'std': float(np.std(valid_data)) if len(valid_data) > 0 else None,
                'count': int(len(valid_data)),
                'bounds': list(dataset.bounds),
                'crs': str(dataset.crs),
                'width': dataset.width,
                'height': dataset.height
            }
            
            # Save metadata
            metadata_file = tile_dir / "metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(stats, f, indent=2)
            
            # Create simple processed version (normalize to 0-255 for visualization)
            processed_data = np.full_like(data, 0, dtype=np.uint8)
            if len(valid_data) > 0:
                # Normalize NDVI values (-1 to 1) to 0-255, handling NaN values
                with np.errstate(invalid='ignore'):
                    normalized = ((data + 1) / 2 * 255)
                # Only convert valid values to uint8, avoiding NaN cast warning
                processed_data = np.where(
                    (data >= -1) & (data <= 1) & (~np.isnan(data)),
                    normalized.astype(np.uint8),
                    0  # No data value
                )
            
            # Save processed data
            output_file = tile_dir / "processed.tif"
            with rasterio.open(
                output_file, 'w',
                driver='GTiff',
                height=dataset.height,
                width=dataset.width,
                count=1,
                dtype=np.uint8,
                crs=dataset.crs,
                transform=dataset.transform,
                compress='lzw'
            ) as dst:
                dst.write(processed_data, 1)
            
            return True, stats
            
    except Exception as e:
        error_msg = str(e)
        if "IReadBlock failed" in error_msg or "TIFFReadEncodedTile" in error_msg:
            print(f"  ⚠ File appears corrupted: {input_file.name}")
            print(f"    TIFF corruption detected - skipping file")
        else:
            print(f"  ✗ Error processing {input_file.name}: {error_msg}")
        return False, None

def create_time_series_index(processed_dir: Path):
    """Create an index of all processed time series data"""
    index = []
    
    for year_month_dir in processed_dir.iterdir():
        if year_month_dir.is_dir():
            metadata_file = year_month_dir / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
                
                parts = year_month_dir.name.split('_')
                if len(parts) == 2:
                    year, month = int(parts[0]), int(parts[1])
                    index.append({
                        'year': year,
                        'month': month,
                        'date': f"{year}-{month:02d}-01",
                        'path': str(year_month_dir.relative_to(processed_dir)),
                        'statistics': metadata
                    })
    
    # Sort by date
    index.sort(key=lambda x: (x['year'], x['month']))
    
    # Save index
    index_file = processed_dir / "index.json"
    with open(index_file, 'w') as f:
        json.dump({
            'created': datetime.now().isoformat(),
            'count': len(index),
            'data': index
        }, f, indent=2)
    
    return index

def main():
    parser = argparse.ArgumentParser(description='Process NDVI TIFF files for web application')
    parser.add_argument('--input-dir', default='../data/raw/tenggeli_data',
                       help='Input directory with TIFF files')
    parser.add_argument('--output-dir', default='../data/processed',
                       help='Output directory for processed files')
    parser.add_argument('--file-pattern', default='tenggeli_ndvi_*.tif',
                       help='File pattern to match')
    
    args = parser.parse_args()
    
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    
    if not input_dir.exists():
        print(f"Error: Input directory {input_dir} does not exist")
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all TIFF files
    tiff_files = list(input_dir.glob(args.file_pattern))
    print(f"Found {len(tiff_files)} files to process")
    
    successful = 0
    failed = 0
    
    # Process each file
    for tiff_file in sorted(tiff_files):
        print(f"Processing {tiff_file.name}...")
        
        # Check file integrity first
        if not check_file_integrity(tiff_file):
            print(f"  ⚠ Skipping corrupted file: {tiff_file.name}")
            failed += 1
            continue
            
        success, stats = process_tiff_to_web_tiles(tiff_file, output_dir)
        
        if success:
            successful += 1
            if stats and stats['count'] > 0:
                print(f"  ✓ Processed successfully - {stats['count']} valid pixels, "
                      f"NDVI range: {stats['min']:.3f} to {stats['max']:.3f}")
            else:
                print(f"  ⚠ Processed but no valid data found")
        else:
            failed += 1
            print(f"  ✗ Processing failed")
    
    print(f"\nProcessing complete:")
    print(f"  Successful: {successful}")
    print(f"  Failed: {failed}")
    
    # Create time series index
    if successful > 0:
        print("\nCreating time series index...")
        index = create_time_series_index(output_dir)
        print(f"Created index with {len(index)} entries")
        print(f"Index saved to: {output_dir / 'index.json'}")

if __name__ == "__main__":
    main()
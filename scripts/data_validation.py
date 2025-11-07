#!/usr/bin/env python3
"""
Data validation script for Tenggeli NDVI data
Checks data integrity, completeness, and basic statistics
"""

import rasterio
import numpy as np
from pathlib import Path
import pandas as pd
from datetime import datetime
import argparse

def validate_tiff_file(file_path: Path) -> dict:
    """Validate a single TIFF file and return statistics"""
    try:
        with rasterio.open(file_path) as dataset:
            data = dataset.read(1)
            
            # Basic file info
            info = {
                'filename': file_path.name,
                'width': dataset.width,
                'height': dataset.height,
                'crs': str(dataset.crs) if dataset.crs else 'Unknown',
                'bounds': dataset.bounds,
                'pixel_count': data.size,
                'valid_pixel_count': 0,
                'nodata_count': 0,
                'invalid_range_count': 0,
                'min_value': None,
                'max_value': None,
                'mean_value': None,
                'std_value': None,
                'status': 'success'
            }
            
            # Check for valid NDVI values (-1 to 1)
            valid_mask = (data >= -1) & (data <= 1) & (~np.isnan(data))
            valid_data = data[valid_mask]
            
            info['valid_pixel_count'] = int(np.sum(valid_mask))
            info['nodata_count'] = int(np.sum(np.isnan(data)))
            info['invalid_range_count'] = int(np.sum((data < -1) | (data > 1)) - info['nodata_count'])
            
            if len(valid_data) > 0:
                info['min_value'] = float(np.min(valid_data))
                info['max_value'] = float(np.max(valid_data))
                info['mean_value'] = float(np.mean(valid_data))
                info['std_value'] = float(np.std(valid_data))
            
            return info
            
    except Exception as e:
        return {
            'filename': file_path.name,
            'status': 'error',
            'error': str(e)
        }

def parse_filename(filename: str) -> tuple:
    """Parse year and month from filename"""
    parts = filename.split('_')
    if len(parts) >= 4:
        try:
            year = int(parts[2])
            month = int(parts[3].split('.')[0])
            return year, month
        except ValueError:
            return None, None
    return None, None

def validate_data_directory(data_path: str) -> pd.DataFrame:
    """Validate all TIFF files in the data directory"""
    data_dir = Path(data_path)
    
    if not data_dir.exists():
        print(f"Error: Data directory {data_path} does not exist")
        return pd.DataFrame()
    
    results = []
    tiff_files = list(data_dir.glob("tenggeli_ndvi_*.tif"))
    
    print(f"Found {len(tiff_files)} NDVI files to validate...")
    
    for file_path in sorted(tiff_files):
        print(f"Validating {file_path.name}...")
        result = validate_tiff_file(file_path)
        
        # Add parsed date information
        year, month = parse_filename(file_path.name)
        result['year'] = year
        result['month'] = month
        
        results.append(result)
    
    return pd.DataFrame(results)

def generate_report(df: pd.DataFrame, output_file: str = None):
    """Generate validation report"""
    print("\n" + "="*60)
    print("TENGGELI NDVI DATA VALIDATION REPORT")
    print("="*60)
    
    # Overall statistics
    total_files = len(df)
    successful_files = len(df[df['status'] == 'success'])
    error_files = len(df[df['status'] == 'error'])
    
    print(f"\nOVERALL STATISTICS:")
    print(f"Total files processed: {total_files}")
    print(f"Successfully processed: {successful_files}")
    print(f"Files with errors: {error_files}")
    
    if error_files > 0:
        print(f"\nERROR FILES:")
        error_df = df[df['status'] == 'error']
        for _, row in error_df.iterrows():
            print(f"  {row['filename']}: {row.get('error', 'Unknown error')}")
    
    # Data coverage analysis
    if successful_files > 0:
        success_df = df[df['status'] == 'success'].copy()
        
        print(f"\nDATA COVERAGE:")
        years = sorted(success_df['year'].dropna().unique())
        print(f"Year range: {min(years)}-{max(years)}")
        
        # Monthly coverage by year
        coverage = success_df.groupby('year')['month'].count()
        print(f"\nMonthly coverage by year:")
        for year, count in coverage.items():
            print(f"  {year}: {count} months")
        
        # Data quality statistics
        print(f"\nDATA QUALITY STATISTICS:")
        print(f"Average valid pixels per file: {success_df['valid_pixel_count'].mean():.0f}")
        print(f"Average NDVI value: {success_df['mean_value'].mean():.4f}")
        print(f"NDVI range: {success_df['min_value'].min():.4f} to {success_df['max_value'].max():.4f}")
        
        # Identify potential issues
        low_coverage_files = success_df[success_df['valid_pixel_count'] < success_df['valid_pixel_count'].quantile(0.1)]
        if len(low_coverage_files) > 0:
            print(f"\nFILES WITH LOW DATA COVERAGE ({len(low_coverage_files)} files):")
            for _, row in low_coverage_files.iterrows():
                print(f"  {row['filename']}: {row['valid_pixel_count']} valid pixels")
    
    # Save detailed report
    if output_file:
        df.to_csv(output_file, index=False)
        print(f"\nDetailed report saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Validate Tenggeli NDVI data files')
    # Default to Google Drive path, allow override with environment variable or command line
    default_data_path = os.getenv('NDVI_RAW_DATA_PATH', '/mnt/g/我的云端硬盘/tenggeli_data')
    parser.add_argument('--data-path', default=default_data_path, 
                       help='Path to data directory')
    parser.add_argument('--output', help='Output CSV file for detailed report')
    
    args = parser.parse_args()
    
    # Validate data
    df = validate_data_directory(args.data_path)
    
    if len(df) == 0:
        print("No data files found or directory doesn't exist")
        return
    
    # Generate report
    output_file = args.output or f"validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    generate_report(df, output_file)

if __name__ == "__main__":
    main()
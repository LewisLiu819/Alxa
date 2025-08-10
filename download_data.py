"""
Tenggeli Desert Satellite Data Download Script for Google Colab

This script downloads and processes Landsat 8/9 data for the Tenggeli Desert
monitoring project (2020-2025). It calculates NDVI and exports monthly composites.

For Google Colab usage:
1. Run installation cell first
2. Authenticate with Google Earth Engine
3. Mount Google Drive (optional)
4. Run the main processing cells

Requirements:
    - Google Earth Engine account and authentication
    - Google Colab environment
"""

# ========== GOOGLE COLAB SETUP CELL ==========
# Run this cell first in Google Colab

# Install required packages
import subprocess
import sys

def install_packages():
    """Install required packages for Google Colab."""
    packages = [
        'earthengine-api',
        'geemap',
        'folium'
    ]

    for package in packages:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")

# Uncomment the line below to install packages
# install_packages()

# ========== IMPORTS AND AUTHENTICATION ==========

import ee
import os
import json
import logging
from datetime import datetime

# Google Colab specific imports
try:
    from google.colab import drive, files
    COLAB_ENV = True
    print("✓ Running in Google Colab environment")
except ImportError:
    COLAB_ENV = False
    print("✗ Not running in Google Colab")

# Optional: for visualization
try:
    import geemap
    import folium
    GEEMAP_AVAILABLE = True
    print("✓ geemap available for visualization")
except ImportError:
    GEEMAP_AVAILABLE = False
    print("⚠ geemap not available. Visualization features disabled.")

# ========== EARTH ENGINE AUTHENTICATION ==========
# Run this cell to authenticate with Google Earth Engine

def authenticate_ee(project_id=None):
    """Authenticate and initialize Google Earth Engine for Colab.
    
    Args:
        project_id: Google Cloud project ID (optional, will prompt if not provided)
    """
    try:
        # For Google Colab, use the service account or authenticate
        ee.Authenticate()
        
        if project_id is None:
            print("⚠ No project ID provided. Please provide your Google Cloud project ID:")
            print("Example: authenticate_ee('your-project-id')")
            print("Or set it in the class initialization")
            return False
            
        ee.Initialize(project=project_id)
        print("✓ Google Earth Engine authenticated and initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize Earth Engine: {e}")
        print("Please run ee.Authenticate() manually if needed")
        return False

# Authenticate automatically
authenticate_ee()

# ========== GOOGLE DRIVE MOUNTING (OPTIONAL) ==========
# Uncomment to mount Google Drive for saving results locally

def mount_drive():
    """Mount Google Drive in Colab."""
    if COLAB_ENV:
        try:
            drive.mount('/content/drive')
            print("✓ Google Drive mounted successfully")
            return '/content/drive/MyDrive/tenggeli_data_precise'
        except Exception as e:
            print(f"✗ Failed to mount Google Drive: {e}")
            return '/content/tenggeli_data_precise'
    else:
        return './data'

# Uncomment the line below to mount Google Drive
# drive_path = mount_drive()


class TenggeliDataDownloader:
    """Downloads and processes satellite data for Tenggeli Desert monitoring."""

    def __init__(self, output_dir: str = "./data", project_id: str = None):
        """Initialize the data downloader.

        Args:
            output_dir: Directory to save processed data
            project_id: Google Cloud project ID for Earth Engine
        """
        self.output_dir = output_dir
        self.project_id = project_id
        self.setup_logging()
        self.setup_directories()

        # Tenggeli Desert region boundaries (approximate)
        # Based on Inner Mongolia, China coordinates
        self.region = ee.Geometry.Rectangle([
            103,  # West longitude
            37.5,   # South latitude
            105.2,  # East longitude
            39.0    # North latitude
        ])

        # Cloud cover threshold
        self.cloud_threshold = 20

    def setup_logging(self):
        """Setup logging configuration."""
        if COLAB_ENV:
            # Simplified logging for Colab
            logging.basicConfig(
                level=logging.INFO,
                format='%(levelname)s - %(message)s'
            )
        else:
            logging.basicConfig(
                level=logging.INFO,
                format='%(asctime)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler('tenggeli_download.log'),
                    logging.StreamHandler()
                ]
            )
        self.logger = logging.getLogger(__name__)

    def setup_directories(self):
        """Create necessary directories for data storage."""
        directories = [
            self.output_dir,
            os.path.join(self.output_dir, 'raw'),
            os.path.join(self.output_dir, 'processed'),
            os.path.join(self.output_dir, 'ndvi_composites'),
            os.path.join(self.output_dir, 'exports')
        ]

        for directory in directories:
            os.makedirs(directory, exist_ok=True)

        self.logger.info(f"Created directories in: {self.output_dir}")

    def authenticate_ee(self):
        """Authenticate and initialize Google Earth Engine."""
        try:
            if self.project_id:
                ee.Initialize(project=self.project_id)
            else:
                ee.Initialize()
            self.logger.info("Google Earth Engine initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Earth Engine: {e}")
            if not self.project_id:
                self.logger.info("Consider providing project_id parameter for better compatibility")
            self.logger.info("Please run 'earthengine authenticate' first")
            sys.exit(1)

    def apply_scale_factors(self, image: ee.Image) -> ee.Image:
        """Apply scaling factors to Landsat Collection 2 surface reflectance data.

        Args:
            image: Raw Landsat image

        Returns:
            Scaled image with proper surface reflectance values
        """
        optical_bands = image.select('SR_B.').multiply(0.0000275).add(-0.2)
        thermal_bands = image.select('ST_B.*').multiply(0.00341802).add(149.0)

        return image.addBands(optical_bands, None, True).addBands(
            thermal_bands, None, True
        )

    def mask_clouds(self, image: ee.Image) -> ee.Image:
        """Mask clouds and cloud shadows using QA_PIXEL band.

        Args:
            image: Landsat image with QA_PIXEL band

        Returns:
            Cloud-masked image
        """
        qa = image.select('QA_PIXEL')

        # Bits 3 and 5 are cloud shadow and cloud, respectively
        cloud_shadow_bit_mask = (1 << 3)
        clouds_bit_mask = (1 << 5)

        # Both flags should be set to zero, indicating clear conditions
        mask = qa.bitwiseAnd(cloud_shadow_bit_mask).eq(0).And(
            qa.bitwiseAnd(clouds_bit_mask).eq(0)
        )

        return image.updateMask(mask)

    def calculate_ndvi(self, image: ee.Image) -> ee.Image:
        """Calculate NDVI from Landsat surface reflectance bands.

        Args:
            image: Scaled Landsat image

        Returns:
            Image with NDVI band added
        """
        ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI')
        return image.addBands(ndvi)

    def get_monthly_collection(self, year: int, month: int) -> ee.ImageCollection:
        """Get Landsat collection for a specific month.

        Args:
            year: Year (2020-2025)
            month: Month (1-12)

        Returns:
            Filtered and processed ImageCollection
        """
        # Calculate date range for the month
        start_date = f"{year}-{month:02d}-01"

        if month == 12:
            end_date = f"{year + 1}-01-01"
        else:
            end_date = f"{year}-{month + 1:02d}-01"

        self.logger.info(f"Processing {year}-{month:02d}: {start_date} to {end_date}")

        # Get Landsat 8 and 9 collections
        landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
        landsat9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')

        # Combine collections
        collection = landsat8.merge(landsat9)

        # Apply filters
        collection = collection.filterDate(start_date, end_date) \
                              .filterBounds(self.region) \
                              .filter(ee.Filter.lt('CLOUD_COVER', self.cloud_threshold))

        # Apply processing functions
        collection = collection.map(self.apply_scale_factors) \
                              .map(self.mask_clouds) \
                              .map(self.calculate_ndvi)

        return collection

    def create_monthly_composite(self, year: int, month: int) -> ee.Image:
        """Create monthly NDVI composite.

        Args:
            year: Year (2020-2025)
            month: Month (1-12)

        Returns:
            Monthly composite image
        """
        collection = self.get_monthly_collection(year, month)

        # Check if collection has images
        try:
            count = collection.size()
            count_value = count.getInfo()
            self.logger.info(f"Found {count_value} images for {year}-{month:02d}")

            if count_value == 0:
                self.logger.warning(f"No images found for {year}-{month:02d}")
                return None
        except Exception as e:
            self.logger.error(f"Failed to get collection size for {year}-{month:02d}: {e}")
            return None

        # Create median composite
        composite = collection.median()

        # Add metadata
        composite = composite.set({
            'year': year,
            'month': month,
            'image_count': count_value,
            'region': 'Tenggeli_Desert',
            'processing_date': datetime.now().isoformat()
        })

        return composite

    def export_to_drive(self, image: ee.Image, filename: str, folder: str = 'tenggeli_data'):
        """Export image to Google Drive.

        Args:
            image: Earth Engine image to export
            filename: Output filename
            folder: Google Drive folder name
        """
        if image is None:
            self.logger.warning(f"Skipping export for {filename} - no data")
            return

        task = ee.batch.Export.image.toDrive(
            image=image.select(['NDVI']),
            description=filename,
            folder=folder,
            fileNamePrefix=filename,
            region=self.region,
            scale=30,  # 30m resolution
            crs='EPSG:4326',
            maxPixels=1e9
        )

        task.start()
        self.logger.info(f"Started export task: {filename}")
        return task

    def export_to_asset(self, image: ee.Image, asset_id: str, username: str = None):
        """Export image to Earth Engine Asset.

        Args:
            image: Earth Engine image to export
            asset_id: Asset ID for the exported image (if includes username, use as-is)
            username: Earth Engine username for asset path (required if asset_id doesn't include full path)
        """
        if image is None:
            self.logger.warning(f"Skipping asset export for {asset_id} - no data")
            return

        # Handle asset ID formatting
        if not asset_id.startswith('users/') and not asset_id.startswith('projects/'):
            if username is None:
                self.logger.error("Username required for asset export when asset_id doesn't include full path")
                return None
            asset_id = f"users/{username}/{asset_id}"

        task = ee.batch.Export.image.toAsset(
            image=image.select(['NDVI']),
            description=f"export_{asset_id.split('/')[-1]}",
            assetId=asset_id,
            region=self.region,
            scale=30,
            crs='EPSG:4326',
            maxPixels=1e9
        )

        task.start()
        self.logger.info(f"Started asset export: {asset_id}")
        return task

    def download_year_data(self, year: int, export_method: str = 'drive', username: str = None):
        """Download all monthly composites for a given year.

        Args:
            year: Year to download (2020-2025)
            export_method: 'drive' or 'asset'
            username: Earth Engine username (required for asset exports)
        """
        self.logger.info(f"Starting download for year {year}")
        tasks = []

        for month in range(1, 13):
            try:
                composite = self.create_monthly_composite(year, month)

                if composite is not None:
                    filename = f"tenggeli_ndvi_{year}_{month:02d}"

                    if export_method == 'drive':
                        task = self.export_to_drive(composite, filename)
                    elif export_method == 'asset':
                        asset_id = f"tenggeli/{filename}"
                        task = self.export_to_asset(composite, asset_id, username)

                    if task:
                        tasks.append(task)

            except Exception as e:
                self.logger.error(f"Error processing {year}-{month:02d}: {e}")
                continue

        self.logger.info(f"Submitted {len(tasks)} export tasks for {year}")
        return tasks

    def visualize_sample(self, year: int = 2023, month: int = 6):
        """Create a sample visualization (requires geemap).

        Args:
            year: Year for sample
            month: Month for sample
        """
        if not GEEMAP_AVAILABLE:
            self.logger.warning("geemap not available. Skipping visualization.")
            return

        composite = self.create_monthly_composite(year, month)

        if composite is None:
            self.logger.warning(f"No data available for {year}-{month:02d}")
            return

        # Create map
        m = geemap.Map()
        m.centerObject(self.region, 8)

        # Add NDVI layer
        ndvi_vis = {
            'min': -0.2,
            'max': 0.8,
            'palette': ['red', 'yellow', 'green']
        }

        m.addLayer(composite.select('NDVI'), ndvi_vis, f'NDVI {year}-{month:02d}')

        # Add true color composite
        rgb_vis = {
            'bands': ['SR_B4', 'SR_B3', 'SR_B2'],
            'min': 0.0,
            'max': 0.3,
        }

        m.addLayer(composite, rgb_vis, f'True Color {year}-{month:02d}')

        # Save map
        map_file = os.path.join(self.output_dir, f'sample_map_{year}_{month:02d}.html')
        m.save(map_file)
        self.logger.info(f"Sample map saved to: {map_file}")

        return m

    def display_colab_sample(self, year: int = 2023, month: int = 6):
        """Display sample visualization in Colab notebook."""
        composite = self.create_monthly_composite(year, month)

        if composite is None:
            print(f"⚠ No data available for {year}-{month:02d}")
            return

        if GEEMAP_AVAILABLE:
            # Create and display interactive map
            m = geemap.Map()
            m.centerObject(self.region, 8)

            # Add NDVI layer
            ndvi_vis = {
                'min': -0.2,
                'max': 0.8,
                'palette': ['red', 'yellow', 'green']
            }
            m.addLayer(composite.select('NDVI'), ndvi_vis, f'NDVI {year}-{month:02d}')

            # Add true color composite
            rgb_vis = {
                'bands': ['SR_B4', 'SR_B3', 'SR_B2'],
                'min': 0.0,
                'max': 0.3,
            }
            m.addLayer(composite, rgb_vis, f'True Color {year}-{month:02d}')

            print(f"✓ Displaying NDVI for {year}-{month:02d}")
            return m
        else:
            print("⚠ geemap not available for visualization")
            return None


# ========== COLAB USAGE FUNCTIONS ==========
# Use these functions in Google Colab cells

def download_single_year(year: int, output_dir: str = '/content/tenggeli_data_precise', export_method: str = 'drive', project_id: str = None, username: str = None):
    """
    Download data for a single year - Colab friendly function.

    Args:
        year: Year to download (2020-2024)
        output_dir: Output directory path
        export_method: 'drive' or 'asset'
        project_id: Google Cloud project ID
        username: Earth Engine username (required for asset exports)

    Usage in Colab:
        download_single_year(2023, project_id='your-project-id')
    """
    print(f"🚀 Starting download for year {year}")

    downloader = TenggeliDataDownloader(output_dir, project_id)
    tasks = downloader.download_year_data(year, export_method, username)

    print(f"✓ Submitted {len(tasks)} export tasks for {year}")
    print(f"📊 Check your Google Earth Engine Tasks tab to monitor progress")
    if export_method == 'drive':
        print(f"📁 Data will be saved to Google Drive folder: 'tenggeli_data'")
    else:
        print(f"📁 Data will be saved as Earth Engine assets")

    return tasks

def download_multiple_years(start_year: int = 2020, end_year: int = 2024,
                          output_dir: str = '/content/tenggeli_data_precise',
                          export_method: str = 'drive', project_id: str = None, username: str = None):
    """
    Download data for multiple years - Colab friendly function.

    Args:
        start_year: Start year (default: 2020)
        end_year: End year (default: 2024)
        output_dir: Output directory path
        export_method: 'drive' or 'asset'
        project_id: Google Cloud project ID
        username: Earth Engine username (required for asset exports)

    Usage in Colab:
        download_multiple_years(2020, 2023, project_id='your-project-id')
    """
    print(f"🚀 Starting download for years {start_year}-{end_year}")

    downloader = TenggeliDataDownloader(output_dir, project_id)
    all_tasks = []

    for year in range(start_year, end_year + 1):
        if year > datetime.now().year:
            print(f"⚠ Skipping future year: {year}")
            continue

        print(f"📅 Processing year {year}")
        tasks = downloader.download_year_data(year, export_method, username)
        all_tasks.extend(tasks)
        print(f"✓ Submitted {len(tasks)} tasks for {year}")

    print(f"\n🎉 Total export tasks submitted: {len(all_tasks)}")
    print(f"📊 Check your Google Earth Engine Tasks tab to monitor progress")
    if export_method == 'drive':
        print(f"📁 Data will be saved to Google Drive folder: 'tenggeli_data'")
    else:
        print(f"📁 Data will be saved as Earth Engine assets")

    return all_tasks

def visualize_sample(year: int = 2023, month: int = 6, output_dir: str = '/content/tenggeli_data_precise', project_id: str = None):
    """
    Create sample visualization - Colab friendly function.

    Args:
        year: Year for sample (default: 2023)
        month: Month for sample (default: 6)
        output_dir: Output directory path
        project_id: Google Cloud project ID

    Usage in Colab:
        map_widget = visualize_sample(2023, 6, project_id='your-project-id')
        map_widget  # Display the map
    """
    print(f"🗺️ Creating visualization for {year}-{month:02d}")

    downloader = TenggeliDataDownloader(output_dir, project_id)
    map_widget = downloader.display_colab_sample(year, month)

    return map_widget

def get_data_info(year: int, month: int, output_dir: str = '/content/tenggeli_data_precise', project_id: str = None):
    """
    Get information about available data for a specific month.

    Args:
        year: Year to check
        month: Month to check
        output_dir: Output directory path
        project_id: Google Cloud project ID

    Usage in Colab:
        get_data_info(2023, 6, project_id='your-project-id')
    """
    print(f"📊 Checking data availability for {year}-{month:02d}")

    try:
        downloader = TenggeliDataDownloader(output_dir, project_id)
        collection = downloader.get_monthly_collection(year, month)
        count = collection.size().getInfo()

        if count > 0:
            # Get some sample metadata with error handling
            try:
                first_image = collection.first()
                props = first_image.getInfo()['properties']

                print(f"✓ Found {count} images for {year}-{month:02d}")
                print(f"📅 Sample image date: {props.get('DATE_ACQUIRED', 'N/A')}")
                print(f"☁️ Sample cloud cover: {props.get('CLOUD_COVER', 'N/A')}%")
                print(f"🛰️ Sample satellite: {props.get('SPACECRAFT_ID', 'N/A')}")
            except Exception as e:
                print(f"✓ Found {count} images for {year}-{month:02d}")
                print(f"⚠ Could not retrieve sample metadata: {e}")
        else:
            print(f"⚠ No images found for {year}-{month:02d}")

        return count
    except Exception as e:
        print(f"✗ Error checking data availability: {e}")
        return 0


# ========== COLAB USAGE EXAMPLES ==========
"""
Example usage in Google Colab:

# 1. Install packages (run once)
install_packages()

# 2. Mount Google Drive (optional)
drive_path = mount_drive()

# 3. Download data for a single year
tasks_2023 = download_single_year(2023)

# 4. Download data for multiple years
all_tasks = download_multiple_years(2020, 2023)

# 5. Create visualization
map_widget = visualize_sample(2023, 6)
map_widget  # Display the map

# 6. Check data availability
get_data_info(2023, 6)
"""

print("📚 Tenggeli Desert Data Downloader loaded successfully!")
print("📖 Use the functions above in separate Colab cells")
print("🔧 Available functions: download_single_year(), download_multiple_years(), visualize_sample(), get_data_info()")
#!/usr/bin/env python3
"""
OukaroManager KernelSU Module Build Script
Only packages files from the module directory
"""

import zipfile
import sys
from datetime import datetime
from pathlib import Path

def main():
    print("🔧 Starting OukaroManager KernelSU module build")
    
    # Check module directory
    if not Path("module").exists():
        print("❌ module directory does not exist")
        sys.exit(1)
    
    # Create ZIP filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_name = f"oukaromanager_v1.0.0_{timestamp}.zip"
    
    print(f"🔧 Building package: {zip_name}")
      
    # Create ZIP file, only including contents of module directory
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        module_path = Path("module")
        
        for file_path in module_path.rglob('*'):
            if file_path.is_file():
                # Use path relative to module directory as path in ZIP
                arc_path = file_path.relative_to(module_path)
                zipf.write(file_path, arc_path)
                print(f"✅ {arc_path}")
    
    # Verify result
    if Path(zip_name).exists():
        file_size = Path(zip_name).stat().st_size / 1024
        print(f"✅ Module package created successfully: {zip_name}")
        print(f"🔧 File size: {file_size:.1f} KB")
        
        # Show ZIP contents
        with zipfile.ZipFile(zip_name, 'r') as zipf:
            file_list = zipf.namelist()
            print(f"📦 Contains {len(file_list)} files")
        
        print("✅ 🎉 Build completed!")
    else:
        print("❌ Build failed")
        sys.exit(1)

if __name__ == "__main__":
    # Clean old files
    if len(sys.argv) > 1 and sys.argv[1] == '--clean':
        print("🔧 Cleaning old ZIP files...")
        for zip_file in Path('.').glob('*.zip'):
            zip_file.unlink()
            print(f"🗑️ Deleted {zip_file.name}")
        print("✅ Cleanup completed")
    
    main()
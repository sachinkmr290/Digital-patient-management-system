"""
Create an unsigned Cloudinary upload preset using credentials from .env.
Run this script from the `backend` folder using the backend venv Python.
"""
from dotenv import load_dotenv
import os

load_dotenv()

CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
API_KEY = os.getenv('CLOUDINARY_API_KEY')
API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
PRESET_NAME = os.getenv('CLOUDINARY_UPLOAD_PRESET_NAME', 'dpms_unsigned_preset')

if not CLOUD_NAME or not API_KEY or not API_SECRET:
    print('Cloudinary credentials missing in environment (.env).')
    raise SystemExit(1)

try:
    import cloudinary
    import cloudinary.api
except Exception as e:
    print('cloudinary library not installed:', e)
    raise

cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET)

print('Creating or ensuring unsigned upload preset:', PRESET_NAME)
try:
    # attempt to create preset
    res = cloudinary.api.create_upload_preset(name=PRESET_NAME, unsigned=True, folder='dpms')
    print('Created preset:', res)
except Exception as e:
    # if preset exists, try to fetch or update info
    print('Create failed (may already exist):', str(e))
    try:
        # list existing presets and check
        presets = cloudinary.api.upload_presets()
        for p in presets.get('presets', []):
            if p.get('name') == PRESET_NAME:
                print('Found existing preset:', p)
                break
        else:
            print('Preset not found in list; consider creating it in Cloudinary console.')
    except Exception as e2:
        print('Could not list presets:', e2)

print('Done.')

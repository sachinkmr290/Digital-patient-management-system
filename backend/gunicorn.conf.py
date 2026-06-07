import os

# Render dynamically sets the PORT environment variable. 
# We default to 10000 just in case.
port = os.environ.get("PORT", "10000")

# Tell gunicorn to bind to this port on all public IPs so Render can find it
bind = f"0.0.0.0:{port}"

# Standard worker count for a small Flask app
workers = 2

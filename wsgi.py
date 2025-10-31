# PythonAnywhere WSGI Configuration File
# This file tells PythonAnywhere how to serve your Flask app

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, '/home/YOUR_USERNAME/mysite')
sys.path.insert(0, '/home/YOUR_USERNAME/mysite/backend')

# Change to the backend directory
os.chdir('/home/YOUR_USERNAME/mysite/backend')

# Import the Flask app
from app import app as application

# This is what PythonAnywhere will use to run your app
if __name__ == "__main__":
    application.run()


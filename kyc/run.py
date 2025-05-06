"""
KYC System Launcher

This script adds the current directory to the Python path and runs the KYC app.
"""
import os
import sys

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import app directly
from app import app

if __name__ == "__main__":
    app.run(debug=True, port=5000) 
#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the virtual environment directory
VENV_DIR="./manual_venv"

# Check if the virtual environment directory already exists
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment at $VENV_DIR..."
  # Create the virtual environment using python3
  python3 -m venv "$VENV_DIR"
else
  echo "Virtual environment already exists at $VENV_DIR."
fi

# Activate the virtual environment
# Note: The activation is temporary and only for this script.
# To activate it in your shell, you would run 'source $VENV_DIR/bin/activate'
source "$VENV_DIR/bin/activate"

# Upgrade pip to the latest version
echo "Upgrading pip..."
pip install --upgrade pip

# Install the required packages
# We specify the exact version for scikit-learn to match the model.
echo "Installing dependencies..."
pip install flask flask-cors joblib numpy "scikit-learn==1.6.1"

# Inform the user that setup is complete
echo "
Setup is complete. The virtual environment is ready.
"

# Run the Flask application
echo "Starting the Flask server..."
echo "Press CTRL+C to stop the server."
python backend/app.py

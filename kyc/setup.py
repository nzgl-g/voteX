"""
Setup script for KYC verification system
"""
from setuptools import setup, find_packages

setup(
    name="kyc",
    version="0.1.0",
    description="AI-powered KYC verification system",
    author="Vote System Team",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "Flask>=3.1.0",
        "Werkzeug>=3.1.3",
        "requests",
        "python-dotenv",
        "pillow>=11.1.0",
        "opencv-python>=4.11.0.86",
        "scikit-image>=0.25.1",
        "numpy>=2.0.2",
        "matplotlib>=3.10.0",
        "deepface>=0.0.93",
    ],
    python_requires=">=3.10",
) 
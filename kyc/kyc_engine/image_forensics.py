"""
Image forensics module for pixel-level analysis to detect tampering.
"""
import os
import json
import time
import numpy as np
import cv2
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Tuple
from skimage.util import random_noise
from skimage.metrics import structural_similarity as ssim

from .shared import get_output_path


def analyze_edges(image):
    """
    Analyze image edges to detect anomalies.
    
    Args:
        image: OpenCV image array
        
    Returns:
        Edge strength score
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edges = np.hypot(sobelx, sobely)
    return float(np.mean(edges))


def analyze_noise(image):
    """
    Analyze noise patterns to detect anomalies.
    
    Args:
        image: OpenCV image array
        
    Returns:
        Noise level score
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    noise_estimate = random_noise(gray, mode='gaussian')
    noise_difference = cv2.absdiff(gray, (noise_estimate * 255).astype(np.uint8))
    return float(np.mean(noise_difference))


def detect_cloning(image):
    """
    Detect potential cloning/copy-paste in the image.
    
    Args:
        image: OpenCV image array
        
    Returns:
        Cloning detection score
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    block_size = 50
    clone_scores = []

    for y in range(0, h - block_size + 1, block_size):
        for x in range(0, w - block_size + 1, block_size):
            block = gray[y:y + block_size, x:x + block_size]
            res = cv2.matchTemplate(gray, block, cv2.TM_CCOEFF_NORMED)
            if y < res.shape[0] and x < res.shape[1]:
                res[y, x] = 0  # Avoid self-match
            clone_scores.append(np.max(res))

    return float(max(clone_scores)) if clone_scores else 0.0


def jpeg_artifact_analysis(image):
    """
    Analyze JPEG compression artifacts for anomalies.
    
    Args:
        image: OpenCV image array
        
    Returns:
        Artifact score
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, compressed = cv2.imencode('.jpg', gray, [cv2.IMWRITE_JPEG_QUALITY, 50])
    decompressed = cv2.imdecode(compressed, cv2.IMREAD_GRAYSCALE)
    score, _ = ssim(gray, decompressed, full=True)
    return float(1 - score)


def pixel_level_check(image_path):
    """
    Perform comprehensive pixel-level forensic analysis.
    
    Args:
        image_path: Path to the input image
        
    Returns:
        Dictionary with analysis results
    """
    image = cv2.imread(image_path)
    if image is None:
        return {"status": "error", "message": "Image not found"}

    edge_strength = analyze_edges(image)
    noise_level = analyze_noise(image)
    clone_score = detect_cloning(image)
    artifact_score = jpeg_artifact_analysis(image)

    thresholds = {
        "clone": 0.90,
        "noise": 25.0,
        "edge": 35.0,
        "artifact": 0.10
    }

    weights = {"clone": 0.4, "noise": 0.3, "edge": 0.2, "artifact": 0.1}
    score = sum(
        max(0, (metric - thresholds[key]) * weights[key])
        for key, metric in zip(weights.keys(), [clone_score, noise_level, edge_strength, artifact_score])
    )

    if score >= 1.0:
        status = "fail"
        message = "Image failed the pixel level check due to high manipulation metrics."
    elif score >= 0.5:
        status = "flag for review"
        message = "Image flagged for further review; please check for possible manipulations."
    else:
        status = "success"
        message = "Image successfully passed the pixel level check."

    result = {
        "status": status,
        "score": round(score, 2),
        "details": {
            "edge_strength": round(edge_strength, 2),
            "noise_level": round(noise_level, 2),
            "cloning_score": round(clone_score, 2),
            "artifact_score": round(artifact_score, 2)
        },
        "message": message
    }
    return result


def generate_composite_image(image_path, output_path=None):
    """
    Generate a composite visualization of forensic analysis results.
    
    The visualization includes:
      - Original image
      - Edge detection visualization
      - Noise difference visualization 
      - Cloning detection visualization
      - JPEG artifact difference visualization
      - Summary of analysis results
    
    Args:
        image_path: Path to the input image
        output_path: Optional path to save the composite image
        
    Returns:
        Path to the saved composite image
    """
    if output_path is None:
        output_path = get_output_path("forensics_composite.png", "analysis")
        
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Image not found")

    # Convert for Matplotlib (BGR to RGB)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # --- Edge Visualization ---
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edges = np.hypot(sobelx, sobely)
    edges_norm = cv2.normalize(edges, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # --- Noise Visualization ---
    noise_estimate = random_noise(gray, mode='gaussian')
    noise_diff = cv2.absdiff(gray, (noise_estimate * 255).astype(np.uint8))

    # --- Cloning Visualization ---
    h, w = gray.shape
    block_size = 50
    best_score = 0
    best_location = None
    for y in range(0, h - block_size + 1, block_size):
        for x in range(0, w - block_size + 1, block_size):
            block = gray[y:y + block_size, x:x + block_size]
            res = cv2.matchTemplate(gray, block, cv2.TM_CCOEFF_NORMED)
            if y < res.shape[0] and x < res.shape[1]:
                res[y, x] = -1  # Avoid self-match
            minVal, maxVal, minLoc, maxLoc = cv2.minMaxLoc(res)
            if maxVal > best_score:
                best_score = maxVal
                best_location = (x, y)
    clone_vis = image_rgb.copy()
    if best_location is not None:
        cv2.rectangle(clone_vis, best_location,
                      (best_location[0] + block_size, best_location[1] + block_size),
                      (255, 0, 0), 2)

    # --- JPEG Artifact Visualization ---
    _, compressed = cv2.imencode('.jpg', gray, [cv2.IMWRITE_JPEG_QUALITY, 50])
    decompressed = cv2.imdecode(compressed, cv2.IMREAD_GRAYSCALE)
    artifact_diff = cv2.absdiff(gray, decompressed)
    artifact_norm = cv2.normalize(artifact_diff, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

    # --- Get Summary Analysis ---
    analysis = pixel_level_check(image_path)

    # --- Create Composite Plot ---
    fig, axs = plt.subplots(2, 3, figsize=(15, 10))

    # Original image
    axs[0, 0].imshow(image_rgb)
    axs[0, 0].set_title("Original Image")
    axs[0, 0].axis("off")

    # Edge detection
    axs[0, 1].imshow(edges_norm, cmap="gray")
    axs[0, 1].set_title("Edge Detection")
    axs[0, 1].axis("off")

    # Noise difference
    axs[0, 2].imshow(noise_diff, cmap="gray")
    axs[0, 2].set_title("Noise Difference")
    axs[0, 2].axis("off")

    # Cloning detection
    axs[1, 0].imshow(clone_vis)
    axs[1, 0].set_title("Cloning Detection")
    axs[1, 0].axis("off")

    # JPEG artifact difference
    axs[1, 1].imshow(artifact_norm, cmap="gray")
    axs[1, 1].set_title("JPEG Artifact Difference")
    axs[1, 1].axis("off")

    # Summary tile
    axs[1, 2].axis("off")
    summary_text = (
        f"Status: {analysis['status']}\n"
        f"Score: {analysis['score']}\n"
        f"Edge: {analysis['details']['edge_strength']}\n"
        f"Noise: {analysis['details']['noise_level']}\n"
        f"Clone: {analysis['details']['cloning_score']}\n"
        f"Artifact: {analysis['details']['artifact_score']}\n"
        f"Msg: {analysis['message']}"
    )
    axs[1, 2].text(0.05, 0.5, summary_text, fontsize=12, verticalalignment='center',
                   transform=axs[1, 2].transAxes)
    axs[1, 2].set_title("Summary")

    plt.tight_layout()

    # Save the composite image
    plt.savefig(output_path)
    plt.close(fig)

    return output_path


if __name__ == "__main__":
    # Example test case
    test_image = r"C:\Users\nazguul\Desktop\PFE_Workplace\Resources\ID Cards\new_york_fake_id-scaled-e1601065688702-1600x1029.jpg"
    
    # Run detailed forensic analysis with visualization
    composite_path = generate_composite_image(test_image)
    print(f"Composite forensic image saved at: {composite_path}")
    
    # Simple analysis
    analysis_result = pixel_level_check(test_image)
    print("Forensic Analysis Result:")
    print(analysis_result)

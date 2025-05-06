"""
Error Level Analysis (ELA) module.

Implements ELA techniques to detect image manipulation.
"""
import os
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

from .shared import get_output_path

def ela_analysis(image_path, quality=90, output_path=None):
    """
    Perform Error Level Analysis on an image to detect tampering.
    
    Args:
        image_path: Path to the input image
        quality: JPEG compression quality for recompression
        output_path: Optional path to save the ELA image
        
    Returns:
        Dictionary with analysis results
    """
    # Open the image and convert to RGB
    original = Image.open(image_path).convert("RGB")

    # Generate output path if not provided
    if output_path is None:
        output_path = get_output_path("ela_result.jpg", "analysis")
    
    # Save a temporary JPEG with controlled quality
    temp_path = get_output_path("temp_ela_check.jpg", "temp")
    original.save(temp_path, "JPEG", quality=quality)

    # Reopen the recompressed image
    recompressed = Image.open(temp_path)

    # Compute the absolute difference (Error Level Analysis)
    ela_image = ImageChops.difference(original, recompressed)

    # Enhance differences to make them more visible
    extrema = ela_image.getextrema()
    max_diff = max([ex[1] for ex in extrema])  # Maximum error level
    scale = 255.0 / max_diff if max_diff else 1
    ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)

    # Save the ELA result
    ela_image.save(output_path)

    # Determine the status and message based on error level
    if max_diff < 50:
        status = "success"
        message = "No significant manipulation detected."
    elif 50 <= max_diff < 150:
        status = "flag for review"
        message = "Possible minor modifications. Requires further verification."
    else:
        status = "fail"
        message = "High probability of manipulation detected!"

    report = {
        "status": status,
        "message": message,
        "error_level": max_diff,
        "output_path": output_path
    }
    return report


def generate_composite_ela_image(image_path, quality=90, output_path=None):
    """
    Generate a composite image visualizing the ELA analysis results.

    The composite includes:
      - Original image
      - Recompressed image
      - ELA result image
      - A summary tile with the final ELA analysis report

    Args:
        image_path: Path to the input image
        quality: JPEG compression quality for recompression
        output_path: Optional path to save the composite image
        
    Returns:
        Path to the saved composite image
    """
    # Generate output path if not provided
    if output_path is None:
        output_path = get_output_path("composite_ela_image.png", "analysis")
    
    # Perform ELA analysis and save the result image
    ela_result_path = get_output_path("ela_result.jpg", "analysis")
    report = ela_analysis(image_path, quality=quality, output_path=ela_result_path)

    # Load images with PIL and convert to NumPy arrays for plotting
    original = Image.open(image_path).convert("RGB")
    recompressed = Image.open(get_output_path("temp_ela_check.jpg", "temp")).convert("RGB")
    ela_image = Image.open(ela_result_path).convert("RGB")

    original_np = np.array(original)
    recompressed_np = np.array(recompressed)
    ela_np = np.array(ela_image)

    # Create a 2x2 composite plot using matplotlib
    fig, axs = plt.subplots(2, 2, figsize=(12, 10))

    # Original Image
    axs[0, 0].imshow(original_np)
    axs[0, 0].set_title("Original Image")
    axs[0, 0].axis("off")

    # Recompressed Image
    axs[0, 1].imshow(recompressed_np)
    axs[0, 1].set_title("Recompressed Image")
    axs[0, 1].axis("off")

    # ELA Image
    axs[1, 0].imshow(ela_np)
    axs[1, 0].set_title("ELA Image")
    axs[1, 0].axis("off")

    # Summary Tile with analysis report
    axs[1, 1].axis("off")
    summary_text = (
        f"Status: {report['status']}\n"
        f"Error Level: {report['error_level']}\n"
        f"Message: {report['message']}"
    )
    axs[1, 1].text(0.5, 0.5, summary_text, fontsize=12, ha='center', va='center', wrap=True)
    axs[1, 1].set_title("Summary")

    plt.tight_layout()

    # Save the composite image
    plt.savefig(output_path)
    plt.close(fig)

    return output_path


if __name__ == "__main__":
    # Example test case
    test_image = r"C:\Users\nazguul\Desktop\PFE_Workplace\Resources\ID Cards\new_york_fake_id-scaled-e1601065688702-1600x1029.jpg"
    
    # Run ELA analysis and generate composite visualization
    composite_path = generate_composite_ela_image(test_image, quality=90)
    print(f"Composite ELA image saved at: {composite_path}")
    
    # Simple ELA analysis
    analysis_result = ela_analysis(test_image)
    print("ELA Analysis Result:")
    print(analysis_result)

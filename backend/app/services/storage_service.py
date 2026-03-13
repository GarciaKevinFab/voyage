import base64
import io
from typing import Optional, Tuple
from app.config import settings

try:
    import cloudinary
    import cloudinary.uploader

    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

try:
    from PIL import Image

    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def _configure_cloudinary():
    """Configure cloudinary from URL if available."""
    if settings.CLOUDINARY_URL and HAS_CLOUDINARY:
        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
        return True
    return False


def upload_image(file_bytes: bytes, filename: str) -> Tuple[str, Optional[str]]:
    """
    Upload an image and return (url, thumbnail_url).
    Uses Cloudinary if configured, otherwise returns base64 data URL.
    """
    if _configure_cloudinary():
        try:
            result = cloudinary.uploader.upload(
                file_bytes,
                public_id=filename.rsplit(".", 1)[0] if "." in filename else filename,
                folder="voyage",
                resource_type="image",
            )
            url = result["secure_url"]
            # Create thumbnail transformation
            thumb_url = cloudinary.CloudinaryImage(result["public_id"]).build_url(
                width=400, height=300, crop="fill", quality="auto"
            )
            return url, thumb_url
        except Exception as e:
            print(f"Cloudinary upload error: {e}")

    # Fallback: base64 data URL
    encoded = base64.b64encode(file_bytes).decode("utf-8")

    # Detect mime type
    mime = "image/jpeg"
    if filename.lower().endswith(".png"):
        mime = "image/png"
    elif filename.lower().endswith(".webp"):
        mime = "image/webp"

    url = f"data:{mime};base64,{encoded}"
    thumb_url = create_thumbnail(file_bytes, mime)

    return url, thumb_url


def create_thumbnail(
    file_bytes: bytes, mime: str = "image/jpeg", size: Tuple[int, int] = (400, 300)
) -> Optional[str]:
    """Create a thumbnail version of an image and return as base64 data URL."""
    if not HAS_PIL:
        return None

    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.thumbnail(size, Image.LANCZOS)

        buffer = io.BytesIO()
        fmt = "JPEG"
        if "png" in mime:
            fmt = "PNG"
        elif "webp" in mime:
            fmt = "WEBP"

        if fmt == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        img.save(buffer, format=fmt, quality=80)
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:{mime};base64,{encoded}"
    except Exception as e:
        print(f"Thumbnail creation error: {e}")
        return None

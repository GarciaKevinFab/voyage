import base64
from app.config import settings

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None


def call_claude(
    system: str,
    prompt: str,
    max_tokens: int = 1024,
    image_base64: str = None,
) -> str:
    """Call Claude API and return the text response."""
    if not settings.ANTHROPIC_API_KEY or Anthropic is None:
        return ""

    try:
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        messages_content = []

        if image_base64:
            # Strip data URL prefix if present
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]

            messages_content.append(
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": image_base64,
                    },
                }
            )

        messages_content.append({"type": "text", "text": prompt})

        response = client.messages.create(
            model="claude-sonnet-4-5-20250514",
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": messages_content}],
        )

        return response.content[0].text

    except Exception as e:
        print(f"Claude API error: {e}")
        return ""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.claude_service import call_claude

router = APIRouter()

INTRO_SYSTEM_PROMPT = """You are a world-class editorial writer for Assouline, the luxury travel publishing house.
You write sophisticated, evocative introductions for luxury travel photo books.
Your prose is elegant, culturally informed, and paints vivid sensory pictures of destinations.
You blend historical context with contemporary charm.
Keep introductions to 2-3 paragraphs. Write in a refined, literary style that would feel at home
in a coffee-table book displayed in a collector's library."""

CAPTION_SYSTEM_PROMPT = """You are a poetic travel photographer and writer for Assouline luxury travel books.
Write a short, evocative caption for this travel photograph.
The caption should be 1-2 sentences that capture the mood, light, and essence of the moment.
Be specific about what you see but elevate it with literary flair.
Do not describe the obvious - find the poetry in the scene."""

EPILOGUE_SYSTEM_PROMPT = """You are a world-class editorial writer for Assouline, the luxury travel publishing house.
Write a brief, moving epilogue for a luxury travel photo book.
The epilogue should reflect on the journey, weaving together themes from the introduction and the moments
captured in the photographs. It should feel like a fond farewell to the destination,
leaving the reader with a lasting impression. Keep it to 1-2 paragraphs."""


class IntroRequest(BaseModel):
    country: str
    city: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    subtitle: Optional[str] = None


class CaptionRequest(BaseModel):
    image_base64: str
    city: str
    country: str


class EpilogueRequest(BaseModel):
    city: str
    country: str
    intro: Optional[str] = None
    captions: Optional[List[str]] = []


@router.post("/intro")
async def generate_intro(request: IntroRequest):
    prompt = f"Write an introduction for a luxury travel photo book about {request.city}, {request.country}."
    if request.start_date and request.end_date:
        prompt += f" The trip took place from {request.start_date} to {request.end_date}."
    if request.subtitle:
        prompt += f" The book's subtitle is: '{request.subtitle}'."

    text = call_claude(INTRO_SYSTEM_PROMPT, prompt, max_tokens=1024)

    if not text:
        text = (
            f"Welcome to {request.city}, {request.country}. "
            f"A destination where history whispers through ancient streets "
            f"and modern elegance dances with timeless traditions. "
            f"This collection of photographs captures the essence of a journey "
            f"through one of the world's most captivating destinations."
        )

    return {"text": text}


@router.post("/caption")
async def generate_caption(request: CaptionRequest):
    prompt = f"Write a caption for this travel photograph taken in {request.city}, {request.country}."

    text = call_claude(
        CAPTION_SYSTEM_PROMPT,
        prompt,
        max_tokens=256,
        image_base64=request.image_base64,
    )

    if not text:
        text = f"A moment captured in {request.city}, {request.country}."

    return {"caption": text}


@router.post("/epilogue")
async def generate_epilogue(request: EpilogueRequest):
    prompt = f"Write an epilogue for a luxury travel photo book about {request.city}, {request.country}."
    if request.intro:
        prompt += f"\n\nThe introduction was:\n{request.intro}"
    if request.captions:
        prompt += f"\n\nThe photo captions throughout the book were:\n"
        for i, cap in enumerate(request.captions, 1):
            prompt += f"{i}. {cap}\n"

    text = call_claude(EPILOGUE_SYSTEM_PROMPT, prompt, max_tokens=1024)

    if not text:
        text = (
            f"As we close this visual journey through {request.city}, "
            f"we carry with us the colors, textures, and whispered stories "
            f"of a place that has left an indelible mark on our souls. "
            f"Until we return."
        )

    return {"epilogue": text}

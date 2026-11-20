"""AI Feedback Analyzer – Gemini-powered sentiment analysis and recommendations."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.event import Event
from app.models.feedback import Feedback, SentimentType
from app.models.feedback_analysis import FeedbackAnalysis
from app.schemas.ai import FeedbackAnalysisResponse
from app.services.ai.gemini_client import generate_text

_ANALYSIS_SYSTEM_PROMPT = """You are an expert feedback analyst for campus events.
Analyze the provided event feedback and return a JSON response with:
- overall_sentiment: "positive", "neutral", or "negative"
- positive_themes: list of 3-5 specific positive themes identified
- negative_themes: list of 3-5 specific negative themes or areas for improvement
- recommendations: list of 3-5 actionable, specific recommendations for organizers
- detailed_analysis: 2-3 paragraph comprehensive analysis
- individual_sentiments: list of {feedback_id: id, sentiment: positive/neutral/negative, score: 0.0-1.0}

Return ONLY valid JSON, no markdown code blocks."""


async def analyze_event_feedback(
    event_id: uuid.UUID,
    organizer_id: uuid.UUID,
    db: AsyncSession,
) -> FeedbackAnalysisResponse:
    """Run AI sentiment analysis on all feedback for an event."""
    # Verify event and ownership
    event = await db.get(Event, event_id)
    if not event:
        raise NotFoundError("Event", str(event_id))
    if str(event.organizer_id) != str(organizer_id):
        from app.core.exceptions import ForbiddenError
        raise ForbiddenError("You do not own this event")

    # Load feedback
    fb_result = await db.execute(
        select(Feedback).where(Feedback.event_id == event_id)
    )
    feedbacks = list(fb_result.scalars().all())

    if not feedbacks:
        raise ValidationError("No feedback available for this event yet")

    avg_rating = sum(f.rating for f in feedbacks) / len(feedbacks)

    # Build feedback text for AI
    feedback_texts = []
    for fb in feedbacks:
        text = f"[ID: {fb.id}] Rating: {fb.rating}/5"
        if fb.comment:
            text += f" | Comment: {fb.comment}"
        feedback_texts.append(text)

    prompt = f"""Analyze the following {len(feedbacks)} feedback entries for the event "{event.title}":

{chr(10).join(feedback_texts)}

Average rating: {avg_rating:.2f}/5

Provide your analysis as JSON."""

    try:
        response_text = await generate_text(
            prompt=prompt,
            system_instruction=_ANALYSIS_SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=3000,
        )

        # Clean and parse JSON
        response_text = response_text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()

        analysis_data = json.loads(response_text)

    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        analysis_data = {
            "overall_sentiment": "neutral",
            "positive_themes": ["Event organization", "Content quality"],
            "negative_themes": ["Could be improved"],
            "recommendations": ["Gather more specific feedback"],
            "detailed_analysis": "Analysis could not be parsed from AI response.",
            "individual_sentiments": [],
        }
    except Exception as e:
        analysis_data = {
            "overall_sentiment": "neutral",
            "positive_themes": [],
            "negative_themes": [],
            "recommendations": ["Please retry analysis"],
            "detailed_analysis": f"Analysis temporarily unavailable: {str(e)}",
            "individual_sentiments": [],
        }

    # Update individual feedback sentiments
    individual_sentiments = analysis_data.get("individual_sentiments", [])
    sentiment_map = {str(item["feedback_id"]): item for item in individual_sentiments}

    for fb in feedbacks:
        item = sentiment_map.get(str(fb.id))
        if item:
            sentiment_str = item.get("sentiment", "neutral")
            try:
                fb.sentiment = SentimentType(sentiment_str)
            except ValueError:
                fb.sentiment = SentimentType.neutral
            fb.sentiment_score = item.get("score", 0.5)

    # Upsert FeedbackAnalysis
    existing_result = await db.execute(
        select(FeedbackAnalysis).where(FeedbackAnalysis.event_id == event_id)
    )
    analysis_record = existing_result.scalars().first()

    now = datetime.now(timezone.utc)
    if analysis_record:
        analysis_record.overall_sentiment = analysis_data.get("overall_sentiment", "neutral")
        analysis_record.avg_rating = round(avg_rating, 2)
        analysis_record.total_responses = len(feedbacks)
        analysis_record.positive_themes = analysis_data.get("positive_themes", [])
        analysis_record.negative_themes = analysis_data.get("negative_themes", [])
        analysis_record.recommendations = analysis_data.get("recommendations", [])
        analysis_record.detailed_analysis = analysis_data.get("detailed_analysis", "")
        analysis_record.analyzed_at = now
    else:
        analysis_record = FeedbackAnalysis(
            event_id=event_id,
            overall_sentiment=analysis_data.get("overall_sentiment", "neutral"),
            avg_rating=round(avg_rating, 2),
            total_responses=len(feedbacks),
            positive_themes=analysis_data.get("positive_themes", []),
            negative_themes=analysis_data.get("negative_themes", []),
            recommendations=analysis_data.get("recommendations", []),
            detailed_analysis=analysis_data.get("detailed_analysis", ""),
            analyzed_at=now,
        )
        db.add(analysis_record)

    await db.commit()
    await db.refresh(analysis_record)

    return FeedbackAnalysisResponse.model_validate(analysis_record)


async def get_feedback_analysis(
    event_id: uuid.UUID, db: AsyncSession
) -> FeedbackAnalysis | None:
    """Get existing feedback analysis for an event."""
    result = await db.execute(
        select(FeedbackAnalysis).where(FeedbackAnalysis.event_id == event_id)
    )
    return result.scalars().first()

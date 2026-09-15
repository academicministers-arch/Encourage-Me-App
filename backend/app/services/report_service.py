"""
Generates the AI Emotional Health Report (weekly / monthly) as a PDF.

Summarizes mood trends, most common emotions, improvement areas, and
personalized recommendations based on the user's stored emotion entries
over the requested period.
"""

import datetime
import io
from collections import Counter

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

NAVY = colors.HexColor("#0B1F3A")
GREEN = colors.HexColor("#2E8B57")
GRAY = colors.HexColor("#F5F7FA")
DARK = colors.HexColor("#1F2937")

POSITIVE_EMOTIONS = {"happy", "motivated", "excited", "calm"}
CHALLENGING_EMOTIONS = {"stressed", "anxious", "sad", "lonely", "angry", "confused"}

IMPROVEMENT_TIPS = {
    "stressed": "Try scheduling short breathing breaks between tasks to reduce built-up stress.",
    "anxious": "Grounding exercises (5-4-3-2-1 senses technique) can help in anxious moments.",
    "sad": "Consider reaching out to a friend or journaling about what's weighing on you.",
    "lonely": "Small social touchpoints — even a short message to someone — can ease loneliness.",
    "angry": "Physical movement or a short walk can help release built-up frustration.",
    "confused": "Try writing your thoughts out freely for 5 minutes without editing — clarity often follows.",
}


def _period_label(period: str) -> str:
    return "Weekly" if period == "weekly" else "Monthly"


def generate_report_pdf(user_name: str, period: str, entries: list) -> bytes:
    """
    entries: list of objects with .emotion, .message, .created_at (datetime)
    Returns PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        topMargin=0.6 * inch, bottomMargin=0.6 * inch,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleCustom", parent=styles["Title"], textColor=NAVY, fontSize=22, spaceAfter=4)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], textColor=GREEN, fontSize=12, spaceAfter=16)
    heading_style = ParagraphStyle("HeadingCustom", parent=styles["Heading2"], textColor=NAVY, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle("BodyCustom", parent=styles["Normal"], textColor=DARK, fontSize=10.5, leading=15)

    story = []
    story.append(Paragraph("Encourage Me", title_style))
    story.append(Paragraph("Built and Powered by Emtrixz Technology", subtitle_style))
    story.append(HRFlowable(width="100%", color=GREEN, thickness=1.2))
    story.append(Spacer(1, 12))

    today = datetime.datetime.utcnow()
    story.append(Paragraph(f"{_period_label(period)} Emotional Health Report", heading_style))
    story.append(Paragraph(f"Prepared for: <b>{user_name}</b>", body_style))
    story.append(Paragraph(f"Generated on: {today.strftime('%B %d, %Y')}", body_style))

    if not entries:
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            "No check-ins were recorded during this period yet. Start logging your daily "
            "emotions to unlock personalized insights in your next report.", body_style
        ))
        doc.build(story)
        return buffer.getvalue()

    emotion_counts = Counter(e.emotion for e in entries)
    total = len(entries)
    positive_count = sum(v for k, v in emotion_counts.items() if k.lower() in POSITIVE_EMOTIONS)
    most_common = emotion_counts.most_common(3)
    positive_pct = round((positive_count / total) * 100) if total else 0

    # ---- Narrative summary ----
    # Template-based, not a generative model — built entirely from the
    # real numbers above, so every sentence is directly traceable to the
    # user's actual data rather than an AI free-associating.
    story.append(Spacer(1, 10))
    story.append(Paragraph("Your Story This Period", heading_style))

    dominant_emotion, dominant_count = most_common[0]
    dominant_pct = round((dominant_count / total) * 100)

    if positive_pct >= 60:
        tone = (
            f"This has been a genuinely strong stretch for you. Across {total} check-ins, "
            f"{positive_pct}% reflected positive or steady emotional states, with "
            f"<b>{dominant_emotion.lower()}</b> showing up most often ({dominant_pct}% of check-ins)."
        )
    elif positive_pct >= 35:
        tone = (
            f"This period looks mixed — a real balance of easier and harder moments across "
            f"{total} check-ins. <b>{dominant_emotion}</b> was your most common state "
            f"({dominant_pct}% of check-ins), and {positive_pct}% of your entries leaned positive."
        )
    else:
        tone = (
            f"This has clearly been a harder stretch. Across {total} check-ins, "
            f"<b>{dominant_emotion.lower()}</b> came up most often ({dominant_pct}% of the time), "
            f"and only {positive_pct}% of entries reflected an easier emotional state. "
            f"That's worth taking seriously — see the recommendations below."
        )
    story.append(Paragraph(tone, body_style))

    if len(most_common) >= 2:
        second_emotion, second_count = most_common[1]
        story.append(Paragraph(
            f"<b>{second_emotion}</b> was your second most common state, appearing in "
            f"{round((second_count / total) * 100)}% of your check-ins.",
            body_style,
        ))

    # ---- Summary stats table ----
    story.append(Spacer(1, 14))
    story.append(Paragraph("Mood Trends Overview", heading_style))

    table_data = [["Metric", "Value"]]
    table_data.append(["Total Check-ins", str(total)])
    table_data.append(["Most Common Emotion", most_common[0][0] if most_common else "N/A"])
    date_span = f"{entries[-1].created_at.strftime('%b %d')} – {entries[0].created_at.strftime('%b %d, %Y')}"
    table_data.append(["Date Range", date_span])

    t = Table(table_data, colWidths=[220, 250])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)

    # ---- Emotion breakdown ----
    story.append(Spacer(1, 18))
    story.append(Paragraph("Emotion Breakdown", heading_style))
    breakdown_data = [["Emotion", "Occurrences", "% of Check-ins"]]
    for emo, count in emotion_counts.most_common():
        pct = f"{(count / total) * 100:.0f}%"
        breakdown_data.append([emo, str(count), pct])
    bt = Table(breakdown_data, colWidths=[180, 140, 150])
    bt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRAY]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(bt)

    # ---- Improvement areas ----
    challenging = [e for e in emotion_counts if e.lower() in CHALLENGING_EMOTIONS]
    story.append(Spacer(1, 18))
    story.append(Paragraph("Areas for Improvement", heading_style))
    if challenging:
        for emo in sorted(challenging, key=lambda e: -emotion_counts[e])[:3]:
            tip = IMPROVEMENT_TIPS.get(emo.lower(), "Keep tracking this feeling — awareness is the first step to change.")
            story.append(Paragraph(f"<b>{emo.capitalize()}:</b> {tip}", body_style))
            story.append(Spacer(1, 4))
    else:
        story.append(Paragraph(
            "No significant challenging patterns were detected this period — great job maintaining balance!",
            body_style
        ))

    # ---- Personalized recommendations ----
    story.append(Spacer(1, 18))
    story.append(Paragraph("Personalized Recommendations", heading_style))
    recs = []
    if challenging:
        recs.append("Continue daily check-ins to help identify triggers behind challenging emotions.")
        recs.append("Try the guided meditation and breathing content in your Encouragement Library.")
    if positive_count / total >= 0.5:
        recs.append("You're maintaining strong positive momentum — keep up your current routine.")
    recs.append("Set a consistent daily reminder time in Settings to build a lasting check-in habit.")
    for r in recs:
        story.append(Paragraph(f"• {r}", body_style))

    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#E5E7EB"), thickness=0.8))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "This report is generated automatically based on your self-reported check-ins and is not a "
        "substitute for professional mental health care.", ParagraphStyle(
            "Footer", parent=styles["Normal"], textColor=colors.HexColor("#6B7280"), fontSize=8
        )
    ))

    doc.build(story)
    return buffer.getvalue()

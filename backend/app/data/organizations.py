"""
Mental health and psychosocial support organizations shown on the
Support Organizations page.

IMPORTANT: every contact detail here should be independently verifiable
from the organization's own website or official channels before being
trusted in a live app — organizations change phone numbers, hours, and
staff over time. Fields left as None are fields we could not verify a
specific value for; the UI shows "See website" rather than guessing.

Do NOT add an entry here with an invented phone number, email, or hours.
If you only have partial information (e.g. an email but no phone), that's
fine — leave the other fields as None.
"""

ORGANIZATIONS = [
    {
        "id": "mhu-uganda",
        "name": "Mental Health Uganda (MHU)",
        "description": (
            "A national mental health advocacy and support organization in Uganda, "
            "offering a toll-free helpline for anyone needing to talk to someone "
            "about their mental health."
        ),
        "category": "Crisis & General Mental Health Support",
        "country": "Uganda",
        "location": "Kampala, Uganda",
        "phone": "0800 21 21 21",
        "phone_note": "Toll-free, Mon–Fri 8:30am–5:00pm (please confirm current hours on their website)",
        "email": None,
        "website": "https://mentalhealthuganda.org",
        "emergency": True,
    },
    {
        "id": "fida-uganda",
        "name": "FIDA Uganda (Uganda Association of Women Lawyers)",
        "description": (
            "Provides free legal aid and support for gender-based violence and "
            "domestic violence cases, including phone, SMS, and online chat support."
        ),
        "category": "Legal Aid & Gender-Based Violence Support",
        "country": "Uganda",
        "location": "Kampala, Uganda",
        "phone": None,
        "phone_note": "Phone, SMS & online chat available — see website for current contact details",
        "email": None,
        "website": "https://fidauganda.org",
        "emergency": True,
    },
    {
        "id": "beauty-for-ashes-uganda",
        "name": "Beauty for Ashes Humanitarian Initiative",
        "description": (
            "A Kampala-based humanitarian initiative focused on cancer awareness, "
            "early screening, and psychosocial support for individuals and families "
            "affected by cancer."
        ),
        "category": "Cancer Support & Psychosocial Care (non-emergency)",
        "country": "Uganda",
        "location": "Kampala, Uganda",
        "phone": None,
        "phone_note": "Email response time is not guaranteed — not suitable for emergencies",
        "email": "info@b4ashesinitiative.org",
        "website": None,
        "emergency": False,
    },
    {
        "id": "988-us",
        "name": "988 Suicide & Crisis Lifeline",
        "description": (
            "Free, confidential support for people in suicidal crisis or emotional "
            "distress, available 24/7 across the United States."
        ),
        "category": "Crisis Support",
        "country": "United States",
        "location": "United States (phone-based, nationwide)",
        "phone": "988",
        "phone_note": "Call or text, available 24/7",
        "email": None,
        "website": "https://988lifeline.org",
        "emergency": True,
    },
    {
        "id": "crisis-text-line-us",
        "name": "Crisis Text Line",
        "description": (
            "Free, 24/7 text-based crisis support for anyone in the United States "
            "experiencing a mental health crisis."
        ),
        "category": "Crisis Support",
        "country": "United States",
        "location": "United States (text-based, nationwide)",
        "phone": None,
        "phone_note": "Text HOME to 741741, available 24/7",
        "email": None,
        "website": "https://www.crisistextline.org",
        "emergency": True,
    },
    {
        "id": "findahelpline",
        "name": "Find A Helpline",
        "description": (
            "A live, maintained directory of crisis helplines by country — useful "
            "if you're outside Uganda or the US, or if a listed number above has "
            "changed."
        ),
        "category": "Global Directory",
        "country": "International",
        "location": "Online directory, worldwide coverage",
        "phone": None,
        "phone_note": None,
        "email": None,
        "website": "https://findahelpline.com",
        "emergency": True,
    },
]
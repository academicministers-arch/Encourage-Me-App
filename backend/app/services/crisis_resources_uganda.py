"""
Uganda-specific crisis and support resources.

This file separates immediate crisis hotlines from specialized non-emergency
support organizations. All phone numbers, websites, and email addresses should
be re-verified periodically, since NGO contact information can change.
"""

IMMEDIATE_CRISIS_RESOURCES_UGANDA = {
    "message": (
        "If you are in acute distress or thinking about harming yourself, please "
        "use these immediate, real-time resources. If it is an emergency, contact "
        "local emergency services first."
    ),
    "resources": [
        {
            "region": "Uganda",
            "name": "Mental Health Uganda (MHU)",
            "detail": "Toll-free 0800 21 21 21, Mon-Fri 8:30am-5:00pm",
            "type": "immediate",
        },
        {
            "region": "Uganda",
            "name": "FIDA Uganda",
            "detail": "Legal aid + GBV crisis support via phone/SMS/chat — confirm current contact at fidauganda.org",
            "type": "immediate",
        },
        {
            "region": "International",
            "name": "Find a Helpline",
            "detail": "findahelpline.com/countries/ug — live-maintained directory",
            "type": "immediate",
        },
    ],
}

SPECIALIZED_SUPPORT_RESOURCES_UGANDA = {
    "message": (
        "Specialized support organizations for non-emergency needs. These contacts "
        "are not intended for immediate crisis response and may not respond right away."
    ),
    "resources": [
        {
            "region": "Uganda",
            "name": "Beauty for Ashes Humanitarian Initiative",
            "detail": (
                "Cancer support; email info@b4ashesinitiative.org — response time "
                "not guaranteed, not for emergencies"
            ),
            "tag": "Cancer support",
            "type": "specialized",
        },
    ],
}

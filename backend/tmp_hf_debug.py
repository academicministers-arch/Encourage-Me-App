import asyncio
import httpx
from app.config import settings

print('HF token set:', bool(settings.HUGGINGFACE_API_TOKEN))
print('HF journal model:', settings.HUGGINGFACE_JOURNAL_MODEL)

async def main():
    if not settings.HUGGINGFACE_API_TOKEN:
        print('No token, skipping call.')
        return

    url = f'https://api-inference.huggingface.co/models/{settings.HUGGINGFACE_JOURNAL_MODEL}'
    headers = {
        'Authorization': f'Bearer {settings.HUGGINGFACE_API_TOKEN}',
        'Accept': 'application/json',
    }
    payload = {
        'inputs': 'Write a short reflective journal about feeling hopeful today.',
        'parameters': {
            'max_new_tokens': 50,
            'temperature': 0.7,
            'top_p': 0.9,
            'repetition_penalty': 1.1,
            'return_full_text': False,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            print('status_code=', resp.status_code)
            print('text=', resp.text)
        except Exception as e:
            print('exception=', repr(e))

if __name__ == '__main__':
    asyncio.run(main())

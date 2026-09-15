import asyncio
from app.services.huggingface_service import generate_text

prompt = (
    "You are an AI that continues a user's journal entry in first person using their own voice. "
    "The text below is the user's journal start. Continue it directly and expand it into a longer, warm, and heartfelt entry. "
    "Do not give any writing advice, do not explain how to write, and do not mention that this is generated. "
    "Do not include the words 'prompt' or 'user prompt' in the output. "
    "Write in a natural journaling style, adding emotional detail, reflection, and supportive language. "
    "If helpful, include gentle headings such as Academic Support, Personal Growth, or Future Goals. "
    "If media attachments are present, mention them naturally as part of the user's experience.\n\n"
    "User text: Encourage Me has been my steady guide through a really stressful week, and I want to capture how it helped me feel calmer and more hopeful.\n\n"
    "Continue the journal entry from this point and make it feel like the user is writing it themselves."
)

async def main():
    result = await generate_text(prompt)
    print('RESULT:')
    print(repr(result))

if __name__ == '__main__':
    asyncio.run(main())

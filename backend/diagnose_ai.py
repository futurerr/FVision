import asyncio
from openai import OpenAI
import base64

client = OpenAI(
    base_url="http://localhost:8000/api/v1",
    api_key="sk-no-key-required"
)

MODEL_NAME = "Qwen3-VL-8B-Instruct-GGUF"

async def test_ai():
    print(f"Testing connectivity to {client.base_url}")
    try:
        # Simple text test first
        print("1. Testing TEXT completion...")
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("Text Response Object:", response)
        if response and response.choices:
            print("Text Content:", response.choices[0].message.content)
        else:
            print("Text response choices are empty or None")

        # Vision test with dummy tiny image
        print("\n2. Testing VISION completion with dummy pixel...")
        # A 1x1 black pixel in base64
        dummy_b64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What is in this image?"},
                        {"type": "image_url", "image_url": {"url": f"data:image/gif;base64,{dummy_b64}"}}
                    ]
                }
            ],
            max_tokens=20
        )
        print("Vision Response Object:", response)
        if response and response.choices:
            print("Vision Content:", response.choices[0].message.content)
        else:
            print("Vision response choices are empty or None")

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_ai())

from openai import OpenAI
import base64
import os

# Client configuration for local LLM
client = OpenAI(
    base_url="http://localhost:8000/api/v1",
    api_key="sk-no-key-required"
)

MODEL_NAME = "Qwen3-VL-8B-Instruct-GGUF"

import logging

# Setup AI specific logging
ai_logger = logging.getLogger("ai_service")
ai_logger.setLevel(logging.INFO)
if not ai_logger.handlers:
    fh = logging.FileHandler("ai_diagnostic.log", encoding='utf-8')
    fh.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
    ai_logger.addHandler(fh)

class AIService:
    async def analyze_frame(self, image_bytes: bytes, prompt: str = "分析这个足球比赛画面，描述球员位置和战术态势。"):
        try:
            print(f"[AI Service] Starting frame analysis...")
            print(f"[AI Service] Image size: {len(image_bytes)} bytes")
            
            # Encoder image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            print(f"[AI Service] Base64 encoded, length: {len(base64_image)}")
            
            print(f"[AI Service] Calling model: {MODEL_NAME}")
            print(f"[AI Service] API endpoint: {client.base_url}")
            
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                },
                            },
                        ],
                    }
                ],
                max_tokens=300,
                timeout=30.0
            )
            
            print(f"[AI Service] Response object received")
            
            if response is None:
                return "分析失败：AI 服务返回空响应(None)"
            
            # For some local servers, the response might be a dict instead of an object
            is_dict = isinstance(response, dict)
            
            if is_dict:
                choices = response.get('choices')
            else:
                choices = getattr(response, 'choices', None)

            if not choices or len(choices) == 0:
                return "分析失败：AI 服务返回结构异常（无 choices）"
            
            if is_dict:
                content = choices[0].get('message', {}).get('content')
            else:
                content = choices[0].message.content

            if content is None:
                return "分析失败：AI 服务返回内容为空"
                
            print(f"[AI Service] Analysis completed successfully")
            return content
        except Exception as e:
            print(f"[AI Service] EXCEPTION: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return f"分析失败[v2]: {str(e)}。检测到异常类型: {type(e).__name__}"

    async def analyze_text(self, prompt: str):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "user",
                        "content": prompt, # Text-only content
                    }
                ],
                max_tokens=300,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI Text Error: {e}")
            return "战术分析因 AI 服务错误而失败。"

ai_service = AIService()

"""
AI Engine for Graft Systems
Handles communication with AI API providers
"""

import os
import requests
from typing import Optional


class AIEngine:
    """
    Base AI Engine class for handling AI API calls
    Supports multiple AI providers (OpenAI, Anthropic, etc.)
    """

    def __init__(self):
        # Get the AI provider and API key from environment variables
        self.provider = os.getenv("AI_PROVIDER", "openai").lower()
        self.api_key = os.getenv("AI_API_KEY", None)
        self.model = os.getenv("AI_MODEL", "gpt-3.5-turbo")
        
        if not self.api_key:
            raise ValueError("AI_API_KEY environment variable not set. Please configure your AI API key.")

    def get_statistics_insights(self, user_message: str, context: Optional[dict] = None) -> str:
        """
        Get AI insights about user statistics based on user input
        
        Args:
            user_message: User's question or request
            context: Optional context data (user stats, etc.)
            
        Returns:
            AI-generated response
        """
        
        system_prompt = """You are a helpful analytics assistant for Graft Systems, 
a wine distribution and retail analytics platform. 
Your role is to help users understand their wine distribution, inventory, and sales statistics.
Provide clear, actionable insights based on their data and questions.
Ask clarifying questions if needed. Be concise and professional."""

        if self.provider == "openai":
            return self._call_openai(user_message, system_prompt, context)
        elif self.provider == "anthropic":
            return self._call_anthropic(user_message, system_prompt, context)
        elif self.provider == "google":
            return self._call_google(user_message, system_prompt, context)
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _call_openai(self, user_message: str, system_prompt: str, context: Optional[dict] = None) -> str:
        """
        Call OpenAI API
        """
        url = "https://api.openai.com/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        # Build context string if provided
        context_str = ""
        if context:
            context_str = "\n\nUser Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"{user_message}{context_str}"},
            ],
            "temperature": 0.7,
            "max_tokens": 500,
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def _call_anthropic(self, user_message: str, system_prompt: str, context: Optional[dict] = None) -> str:
        """
        Call Anthropic (Claude) API
        """
        url = "https://api.anthropic.com/v1/messages"
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        
        # Build context string if provided
        context_str = ""
        if context:
            context_str = "\n\nUser Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
        
        payload = {
            "model": self.model,
            "max_tokens": 500,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": f"{user_message}{context_str}"},
            ],
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        return data["content"][0]["text"]

    def _call_google(self, user_message: str, system_prompt: str, context: Optional[dict] = None) -> str:
        """
        Call Google Gemini API
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        
        headers = {
            "Content-Type": "application/json",
        }
        
        # Build context string if provided
        context_str = ""
        if context:
            context_str = "\n\nUser Context:\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\n{user_message}{context_str}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500,
            }
        }
        
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            params={"key": self.api_key},
            timeout=30
        )
        response.raise_for_status()
        
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# Initialize engine instance (will be called by views)
def get_ai_engine() -> AIEngine:
    """Get or create AI engine instance"""
    return AIEngine()

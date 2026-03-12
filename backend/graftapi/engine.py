"""
AI Engine for Graft Systems
Powered by LangChain - Handles communication with AI API providers
"""

import os
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
#from langchain_openai import ChatOpenAI
#from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI


class AIEngine:
    """
    LangChain-powered AI Engine for handling AI API calls
    Supports multiple AI providers (OpenAI, Anthropic, Google)
    """

    def __init__(self):
        # Get the AI provider and API key from environment variables
        self.provider = os.getenv("AI_PROVIDER", "openai").lower() #TODO: fix these default values
        self.api_key = os.getenv("AI_API_KEY", None)
        self.model = os.getenv("AI_MODEL", "gpt-3.5-turbo")
        self.temperature = float(os.getenv("AI_TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("AI_MAX_TOKENS", "500"))
        
        if not self.api_key:
            raise ValueError("AI_API_KEY environment variable not set. Please configure your AI API key.")
        
        # Initialize the appropriate chat model
        self.chat_model = self._initialize_chat_model()

    def _initialize_chat_model(self):
        """
        Initialize the appropriate LangChain ChatModel based on provider
        """
        if self.provider == "openai":
            return
            # return ChatOpenAI(
            #     api_key=self.api_key,
            #     model=self.model,
            #     temperature=self.temperature,
            #     max_tokens=self.max_tokens,
            # )
        elif self.provider == "anthropic":
            return
            # return ChatAnthropic(
            #     api_key=self.api_key,
            #     model=self.model,
            #     temperature=self.temperature,
            #     max_tokens=self.max_tokens,
            # )
        elif self.provider == "google":
            return ChatGoogleGenerativeAI(
                google_api_key=self.api_key,
                model=self.model,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
            )
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _format_context(self, context: Optional[dict] = None) -> str:
        """
        Format context dictionary into a string
        """
        if not context:
            return ""
        
        context_str = "\n\nUser Context:\n"
        for key, value in context.items():
            context_str += f"- {key}: {value}\n"
        return context_str

    def get_statistics_insights(self, user_message: str, context: Optional[dict] = None) -> str:
        """
        Get AI insights about user statistics based on user input
        
        Args:
            user_message: User's question or request
            context: Optional context data (user stats, etc.)
            
        Returns:
            AI-generated response
        """
        
        system_prompt = """# Graft Systems Analytics Assistant

        You are a helpful analytics assistant for **Graft Systems**, a wine distribution and retail analytics platform.

        ## Your Role
        Help users understand their:
        - Wine distribution metrics
        - Inventory levels and trends
        - Sales statistics and performance

        ## Guidelines
        1. **Provide clear, actionable insights** based on user data and questions
        2. **Ask clarifying questions** if needed to better understand requests
        3. **Be concise and professional** in all responses
        4. **Use structured formatting** with headers, lists, and tables where appropriate
        5. **Highlight key metrics** and trends with emphasis

        ## Response Format
        - Use **bold** for important metrics and findings
        - Use `code` for specific values or fields
        - Use bullet points and numbered lists for clarity
        - Use tables for comparing multiple data points"""

        # Create a LangChain prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])
        
        # Format context if provided
        context_str = self._format_context(context)
        full_input = f"{user_message}{context_str}"
        
        # Create and invoke the chain
        chain = prompt | self.chat_model
        response = chain.invoke({"input": full_input})
        
        # Extract the text content from the response
        return response.content


# Initialize engine instance (will be called by views)
def get_ai_engine() -> AIEngine:
    """Get or create AI engine instance"""
    return AIEngine()

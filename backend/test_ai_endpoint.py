#!/usr/bin/env python
"""
Quick test of the LangChain AI Engine integration
"""
import requests
import json

# Test the AI chat endpoint
BASE_URL = "http://localhost:8000/api"

def test_ai_chat(message: str, token: str = None):
    """Test the AI chat endpoint"""
    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    payload = {"message": message}
    
    try:
        response = requests.post(
            f"{BASE_URL}/ai/chat/",
            headers=headers,
            json=payload,
            timeout=30
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.json()
    except requests.exceptions.ConnectionError:
        print("✗ Server is not running. Start it with:")
        print("  cd backend && python manage.py runserver")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    print("Testing LangChain AI Engine Integration")
    print("=" * 50)
    print("\nNote: You need a valid JWT token to test the endpoint.")
    print("Try testing in your frontend first, or get a token via /api/login/\n")
    
    # This will fail without auth, but shows how to call it
    print("Testing /api/ai/chat/ endpoint without auth...")
    test_ai_chat("What is the current wine market trend?")

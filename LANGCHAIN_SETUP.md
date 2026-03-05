# LangChain AI Engine - Getting Started Guide

## ✅ What's Been Done

Your AI engine has been completely migrated from raw HTTP requests to **LangChain**.

### Key Changes:
- **Engine:** `/backend/graftapi/engine.py` now uses LangChain
- **Providers Supported:** OpenAI, Anthropic (Claude), Google Gemini
- **Dependencies:** Added langchain packages to requirements.txt
- **API Interface:** Unchanged - all existing endpoints work as-is

---

## 🚀 Getting Started

### 1. **Check Your Configuration**

Your `.env` file in `/backend/.env` is already set up:

```env
AI_PROVIDER=google
AI_API_KEY=your-api-key
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=500
```

#### To Change Providers:

**OpenAI:**
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo
```

**Anthropic (Claude):**
```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_MODEL=claude-3-haiku-20240307
```

**Google Gemini:** (current)
```env
AI_PROVIDER=google
AI_API_KEY=AIzaSy...
AI_MODEL=gemini-2.5-flash
```

---

### 2. **Start the Backend**

From the root directory:

```bash
cd backend
python manage.py runserver
```

You should see:
```
Starting development server at http://127.0.0.1:8000/
```

---

### 3. **Test the AI Endpoints**

#### In Your Frontend:
The AI chat window already connects to:
- `POST /api/ai/chat/` - Chat with the AI
- `POST /api/generate-marketing/` - Generate marketing content

#### Via cURL (with token):
```bash
curl -X POST http://localhost:8000/api/ai/chat/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "What wine inventory trends do you see?"}'
```

#### Via Python:
```python
from graftapi.engine import get_ai_engine

engine = get_ai_engine()

# Simple call
response = engine.get_statistics_insights(
    "Analyze my wine sales performance"
)
print(response)

# With context data
response = engine.get_statistics_insights(
    "Should I reorder this wine?",
    context={
        "wine_name": "Cabernet Sauvignon 2020",
        "current_inventory": 50,
        "sales_per_week": 5,
        "days_until_shortage": 10
    }
)
print(response)
```

---

## 📝 Code Examples

### Example 1: Chat Response
```python
from graftapi.engine import get_ai_engine

engine = get_ai_engine()

response = engine.get_statistics_insights(
    user_message="What are the top selling wines?",
    context={"user": "john_doe"}
)

print(response)
# Output: "Based on your analytics, the top selling wines..."
```

### Example 2: Marketing Generation
```python
from graftapi.views import generate_marketing  # Already integrated

# The view already uses the new engine:
# 1. Gets engine instance
# 2. Calls engine.get_statistics_insights()
# 3. Returns generated content
```

### Example 3: Direct View Integration
In `/backend/graftapi/views.py`, the endpoints automatically use LangChain:

```python
def ai_chat(request):
    from .engine import get_ai_engine
    
    engine = get_ai_engine()  # LangChain-powered
    response = engine.get_statistics_insights(user_message, context)
    return Response({"message": response})
```

---

## 🔧 Configuration Options

Edit `/backend/.env` to customize:

```env
# Provider & API Key
AI_PROVIDER=google              # openai, anthropic, or google
AI_API_KEY=your-key-here        # Get from provider
AI_MODEL=gemini-2.5-flash       # Model to use

# Behavior tuning
AI_TEMPERATURE=0.7              # 0.0 (deterministic) to 1.0 (creative)
AI_MAX_TOKENS=500               # Response length limit
```

### Temperature Explanation:
- **0.0** = Deterministic, same response every time
- **0.5** = Balanced
- **1.0** = Creative, varied responses

---

## 🧪 Testing

### Run the test script:
```bash
cd backend
python test_ai_endpoint.py
```

### Check server health:
```bash
python manage.py check
```

---

## 🎯 Common Use Cases

### Analytics Insights
```python
response = engine.get_statistics_insights(
    "What's my wine distribution performance?"
)
```

### Inventory Analysis
```python
response = engine.get_statistics_insights(
    "Which wines need reordering?",
    context={"inventory_level": "low"}
)
```

### Marketing Content
Already integrated in `generate_marketing` view - just call the endpoint.

---

## ⚡ What's Happening Under the Hood

### Old System (Raw HTTP):
```python
response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    json=payload,
    headers=headers
)
```

### New System (LangChain):
```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

chat_model = ChatOpenAI(api_key=key, model="gpt-3.5-turbo")
prompt = ChatPromptTemplate.from_messages([...])
chain = prompt | chat_model
response = chain.invoke({"input": message})
```

**Benefits:**
- ✅ Cleaner, more maintainable code
- ✅ Built-in error handling
- ✅ Easy to add chains, memory, retrieval
- ✅ Consistent API across providers
- ✅ Better integration with LangChain ecosystem

---

## 📞 Troubleshooting

### "No module named 'langchain_core'"
```bash
pip install langchain==0.2.11 langchain-openai==0.1.15 langchain-anthropic==0.1.15 langchain-google-genai==1.0.5
```

### "AI_API_KEY not set"
Add to `/backend/.env`:
```env
AI_API_KEY=your-actual-api-key
```

### Server won't start
```bash
python manage.py check    # Check for errors
python manage.py migrate  # Ensure DB is setup
python manage.py runserver
```

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat/` | POST | Chat with AI |
| `/api/generate-marketing/` | POST | Generate marketing content |

Both endpoints require JWT authentication (login first).

---

## 📚 Next Steps

1. Start the backend server
2. Access frontend at `http://localhost:3000`
3. Login to your account
4. Open the AI window in your dashboard
5. Start chatting!

---

**Happy coding! 🍷🤖**

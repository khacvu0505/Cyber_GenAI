import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()


llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant. Respond ONLY in {language}. Never use any other language, even if the question is in a different language."),
    ("human", "{input}"),
])

chain = prompt | llm

response = chain.invoke({
    "input": "Javascript là gi?",
    "language": "Tiếng Nhật"
})

print("Response", response.content)
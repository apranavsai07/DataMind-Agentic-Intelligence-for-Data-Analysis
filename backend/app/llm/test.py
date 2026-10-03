from app.llm.factory import get_llm

llm = get_llm()

response = llm.invoke("Who are you?")

print(response.content)
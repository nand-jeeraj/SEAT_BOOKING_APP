import os
from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv()


MONGO_URL = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")


client = MongoClient(MONGO_URL)
db = client[DB_NAME]

try:
    db.list_collection_names()
    print("MongoDB connection successful.")
except Exception as e:
    print("MongoDB connection failed:", e)

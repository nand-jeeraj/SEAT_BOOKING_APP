import os
from dotenv import load_dotenv
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "seat_booking_db")
DB_NAME_login = os.getenv("DB_NAME_login", "test")
API_PREFIX = "/api"

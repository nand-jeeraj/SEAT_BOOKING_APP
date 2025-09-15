from flask import Blueprint, request, jsonify
from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from datetime import datetime
import pytz
from config import MONGO_URI, DB_NAME, DB_NAME_login  # <-- added DB_NAME_login

seating_bp = Blueprint("seating", __name__)

client = MongoClient(MONGO_URI)


db_classes = client[DB_NAME]         
db_users = client[DB_NAME_login]    

classes = db_classes["classes"]
bookings = db_classes["bookings"]
counters = db_classes["counters"]
users = db_users["users"]

IST = pytz.timezone("Asia/Kolkata")



def oid(x):
    return ObjectId(x) if isinstance(x, str) else x


def serialize(doc):
    if not doc:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
   
    for k in ["created_at", "start_time", "promoted_at"]:
     if k in doc and isinstance(doc[k], datetime):
        doc[k] = doc[k].astimezone(IST).isoformat()
    return doc


def seats_summary(class_id: str):
    class_doc = classes.find_one({"_id": oid(class_id)})
    if not class_doc:
        return None
    total = class_doc.get("total_seats", 0)
    confirmed_count = bookings.count_documents({"class_id": str(class_id), "status": "confirmed"})
    waiting_count = bookings.count_documents({"class_id": str(class_id), "status": "waiting"})
    return {
        "total_seats": total,
        "confirmed": confirmed_count,
        "waiting": waiting_count,
        "available": max(total - confirmed_count, 0),
    }


def promote_from_waitlist(class_id: str):
    doc = bookings.find_one_and_update(
        {"class_id": class_id, "status": "waiting"},
        {"$set": {"status": "confirmed", "promoted_at": datetime.now()}},
        sort=[("created_at", ASCENDING)],
        return_document=True,
    )
    return doc


def get_next_class_id():
    counter = counters.find_one_and_update(
        {"_id": "classid"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    return f"CLS{counter['seq']:04d}"





@seating_bp.post("/faculty/classes")
def create_class():
    data = request.get_json() or {}
    required = [
        "colid",
        "semester",
        "subject_name",
        "program_name",
        "section",
        "department",
        "start_time",
        "hours",
        "total_seats",
    ]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    
    try:
        start_time = datetime.fromisoformat(data["start_time"])
    except Exception:
        return jsonify({"error": "start_time must be an ISO datetime string"}), 400

    colid = str(data["colid"]).strip()
    semester = int(data["semester"])
    department = str(data["department"]).strip().lower()
    section = str(data["section"]).strip().lower()
    program_name = str(data["program_name"]).strip().lower()

   
    try:
        hours_num = float(data["hours"])
    except Exception:
        return jsonify({"error": "hours must be a number"}), 400

    
    try:
        total_seats_num = int(data["total_seats"])
    except Exception:
        return jsonify({"error": "total_seats must be an integer"}), 400

   
    from datetime import timedelta
    end_time = start_time + timedelta(hours=hours_num)

    
    conflict_q = {
        "colid": colid,
        "department": department,
        "semester": semester,
        "program_name": program_name,
        "$or": [
            {
                "start_time": {"$lt": end_time},
                "end_time": {"$gt": start_time},
            }
        ],
    }
    existing_conflict = classes.find_one(conflict_q)
    if existing_conflict:
        return (
            jsonify(
                {
                    "error": (
                        "A session already exists during this time slot for this "
                        "department, program, and semester. "
                        f"Existing session is from "
                        f"{existing_conflict['start_time'].strftime('%d-%m-%Y %H:%M')} "
                        f"to {existing_conflict['end_time'].strftime('%H:%M')}."
                    ),
                    "conflict_class_id": existing_conflict.get("class_id"),
                }
            ),
            409,
        )

   
    class_id = get_next_class_id()

    
    doc = {
        "colid": colid,
        "semester": semester,
        "subject_name": data["subject_name"].strip(),
        "program_name": program_name,
        "section": section,
        "department": department,
        "start_time": start_time,
        "end_time": end_time, 
        "hours": hours_num,
        "total_seats": total_seats_num,
        "created_at": datetime.now(),
        "class_id": class_id,
    }

    result = classes.insert_one(doc)
    return jsonify({"id": str(result.inserted_id), "class_id": class_id}), 201


@seating_bp.get("/student/classes")
def student_classes():
    student_id = request.args.get("student_id")
    if not student_id:
        return jsonify({"error": "student_id required"}), 400

    user = users.find_one({"_id": oid(student_id)})
    if not user:
        return jsonify({"error": "Student not found"}), 404

    
    student_colid = str(user.get("colid"))
    semester = int(user.get("semester")) if user.get("semester") else None
    section = str(user.get("section")).strip().lower()
    programcode = str(user.get("programcode")).strip().lower()
    department = str(user.get("department")).strip().lower()

    query = {
        "colid": student_colid,
        "semester": semester,
        "section": section,
        "department": department,
        "program_name": programcode,
    }

    
    print(" Student Info ->", {
        "colid": student_colid,
        "semester": semester,
        "section": section,
        "programcode": programcode,
        "department": department,
    })
    print(" MongoDB Query ->", query)

    data = [serialize(doc) for doc in classes.find(query).sort("start_time", ASCENDING)]
    print(" Classes Found ->", len(data))

    for d in data:
        d["seats"] = seats_summary(d["id"])

    return jsonify(data)


@seating_bp.get("/classes/<class_id>")
def get_class(class_id):
    doc = classes.find_one({"_id": oid(class_id)})
    if not doc:
        return jsonify({"error": "Class not found"}), 404
    data = serialize(doc)
    data["seats"] = seats_summary(class_id)
    return jsonify(data)


@seating_bp.post("/bookings")
def create_booking():
    data = request.get_json() or {}
    required = ["class_id", "student_id", "student_name"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    class_id = str(data["class_id"])
    student_id = str(data["student_id"])

    existing = bookings.find_one({"class_id": class_id, "student_id": student_id})
    if existing:
        return jsonify({"error": "You have already booked this class."}), 409

    seat_info = seats_summary(class_id)
    if not seat_info:
        return jsonify({"error": "Class not found"}), 404
    existing = bookings.find_one({"class_id": class_id, "student_id": student_id})
    if existing:
       return jsonify({"error": "You have already booked this class."}), 409

    status = "confirmed" if seat_info["available"] > 0 else "waiting"

    doc = {
        "class_id": class_id,
        "student_id": student_id,
        "student_name": data["student_name"].strip(),
        "status": status,
        "created_at": datetime.now(),
    }

    inserted = bookings.insert_one(doc)
    return jsonify({"id": str(inserted.inserted_id), "status": status, "seats": seats_summary(class_id)}), 201


@seating_bp.get("/bookings")
def list_bookings():
    student_id = request.args.get("student_id")
    class_id = request.args.get("class_id")
    q = {}
    if student_id:
        q["student_id"] = str(student_id)
    if class_id:
        q["class_id"] = str(class_id)

    bookings_data = []
    for b in bookings.find(q).sort("created_at", ASCENDING):
        b = serialize(b)
        class_doc = classes.find_one({"_id": oid(b["class_id"])})
        if class_doc:
            b["class_name"] = class_doc.get("class_name", "")
            b["topic"] = class_doc.get("topic", "")
            b["subject_name"] = class_doc.get("subject_name", "") 
            b["start_time"] = class_doc.get("start_time")
        bookings_data.append(b)

    return jsonify(bookings_data)


@seating_bp.delete("/bookings/<booking_id>")
def cancel_booking(booking_id):
    b = bookings.find_one({"_id": oid(booking_id)})
    if not b:
        return jsonify({"error": "Booking not found"}), 404
    class_id = b["class_id"]
    was_confirmed = b["status"] == "confirmed"
    bookings.delete_one({"_id": b["_id"]})
    promoted = None
    if was_confirmed:
        promoted = promote_from_waitlist(class_id)
    return jsonify(
        {"ok": True, "promoted": serialize(promoted) if promoted else None, "seats": seats_summary(class_id)}
    )


from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from seating_app import seating_bp
from auth import auth_bp
from config import API_PREFIX

app = Flask(__name__)
app.secret_key = "super-secret-key"  

CORS(app, supports_credentials=True)



login_manager = LoginManager()
login_manager.init_app(app)  
login_manager.login_view = "/api/login" 


from user import DummyUser
@login_manager.user_loader
def load_user(user_id):
    return DummyUser(user_id)


app.register_blueprint(seating_bp)
app.register_blueprint(auth_bp, url_prefix=f"{API_PREFIX}")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

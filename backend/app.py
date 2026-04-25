from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-this-secret")
    # Configure CORS to allow preflight requests
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})
    jwt = JWTManager(app)

    # Allow OPTIONS requests to bypass JWT checking
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return "", 200

    # register blueprints
    from routes.auth import auth_bp
    from routes.patients import patients_bp
    from routes.appointments import appointments_bp
    from routes.uploads import uploads_bp
    from routes.reminders import reminders_bp
    from routes.medicines import medicines_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(patients_bp, url_prefix="/api/patients")
    app.register_blueprint(appointments_bp, url_prefix="/api/appointments")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")
    app.register_blueprint(reminders_bp, url_prefix="/api/reminders")
    app.register_blueprint(medicines_bp, url_prefix="/api/medicines")

    @app.route("/")
    def index():
        return jsonify({"status": "ok", "project": "Digital Patient Management System"})

    return app


# expose WSGI callable for servers (gunicorn, render)
app = create_app()

# Start scheduler (avoid double-start with Flask reloader)
try:
    from reminders import init_scheduler
    if os.getenv("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        init_scheduler(app)
except Exception:
    # scheduler is best-effort; don't prevent app from running
    app.logger.exception("Failed to start reminder scheduler")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_ENV") == "development")

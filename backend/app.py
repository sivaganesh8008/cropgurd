import os
import json
import uuid
import threading
from datetime import datetime, timezone, timedelta
from functools import wraps

import jwt
import requests
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from database import init_db, get_db, row_to_dict, recommendation_to_dict

load_dotenv()
init_db()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
CORS(app, resources={r"/api/*": {"origins": "*"}})

JWT_SECRET = os.getenv("JWT_SECRET", "farmpulse-local-secret-key-2026")
HF_MODEL_ID = os.getenv("HF_MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct").strip()
HF_DEVICE = os.getenv("HF_DEVICE", "auto").strip().lower()
HF_MAX_NEW_TOKENS = int(os.getenv("HF_MAX_NEW_TOKENS", "256"))

_hf_tokenizer = None
_hf_model = None
_hf_device = None
_hf_lock = threading.Lock()


def create_jwt_token(user_id, email):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Please log in first."}), 401
        token = header.removeprefix("Bearer ").strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.user_id = payload["sub"]
            g.user_email = payload.get("email", "")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Your session has expired. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Your session is invalid. Please log in again."}), 401
        return fn(*args, **kwargs)
    return wrapped


def json_error(message, status=400):
    return jsonify({"error": message}), status


def load_huggingface_model():
    """Load the local Transformers model once, on the first chat request."""
    global _hf_tokenizer, _hf_model, _hf_device
    if _hf_model is not None and _hf_tokenizer is not None:
        return _hf_tokenizer, _hf_model, _hf_device
    with _hf_lock:
        if _hf_model is None or _hf_tokenizer is None:
            app.logger.info("Loading Hugging Face model %s (first run downloads into local cache)...", HF_MODEL_ID)
            tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
            model = AutoModelForCausalLM.from_pretrained(HF_MODEL_ID)
            if HF_DEVICE == "cpu":
                device = "cpu"
            elif HF_DEVICE == "cuda":
                if not torch.cuda.is_available():
                    raise RuntimeError("HF_DEVICE=cuda but CUDA is not available. Set HF_DEVICE=auto or cpu.")
                device = "cuda"
            else:
                device = "cuda" if torch.cuda.is_available() else "cpu"
            model.to(device)
            model.eval()
            _hf_tokenizer, _hf_model, _hf_device = tokenizer, model, device
            app.logger.info("Hugging Face model loaded on %s", device)
    return _hf_tokenizer, _hf_model, _hf_device


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "FarmPulse API",
        "database": "SQLite (local file: farmpulse.db)",
        "database_configured": True,
        "ai_provider": "Hugging Face Transformers (local)",
        "ai_model": HF_MODEL_ID,
        "ai_model_loaded": _hf_model is not None,
        "ai_device": _hf_device or ("cuda" if torch.cuda.is_available() else "cpu (auto)"),
        "time": datetime.now(timezone.utc).isoformat()
    })


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    if not email or "@" not in email:
        return json_error("Valid email address is required.")
    if len(password) < 6:
        return json_error("Password must be at least 6 characters.")

    user_id = str(uuid.uuid4())
    password_hash = generate_password_hash(password)
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db()
    try:
        with conn:
            conn.execute(
                "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (user_id, email, password_hash, now_iso)
            )
        token = create_jwt_token(user_id, email)
        return jsonify({
            "session": {
                "user": {"id": user_id, "email": email},
                "access_token": token
            }
        }), 201
    except Exception as exc:
        if "UNIQUE constraint failed" in str(exc):
            return json_error("An account with this email already exists. Please sign in.", 409)
        app.logger.exception("signup failed")
        return json_error(f"Could not register user: {str(exc)[:160]}", 500)
    finally:
        conn.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    if not email or not password:
        return json_error("Email and password are required.")

    conn = get_db()
    try:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cur.fetchone()
        if not user or not check_password_hash(user["password_hash"], password):
            return json_error("Invalid email or password.", 401)

        token = create_jwt_token(user["id"], user["email"])
        return jsonify({
            "session": {
                "user": {"id": user["id"], "email": user["email"]},
                "access_token": token
            }
        })
    finally:
        conn.close()


@app.get("/api/auth/me")
@auth_required
def me():
    return jsonify({"user": {"id": g.user_id, "email": g.user_email}})


@app.get("/api/farms")
@auth_required
def list_farms():
    conn = get_db()
    try:
        cur = conn.execute(
            "SELECT * FROM farms WHERE user_id = ? ORDER BY created_at DESC",
            (g.user_id,)
        )
        farms = [row_to_dict(r) for r in cur.fetchall()]
        return jsonify({"farms": farms})
    except Exception as exc:
        app.logger.exception("list_farms failed")
        return json_error(f"Could not load farms: {str(exc)[:200]}", 500)
    finally:
        conn.close()


@app.post("/api/farms")
@auth_required
def create_farm():
    data = request.get_json(silent=True) or {}
    name = str(data.get("farm_name", "")).strip()
    location = str(data.get("location", "")).strip()
    if not name:
        return json_error("Farm name is required.")

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    land_area = data.get("land_area")

    try:
        lat = float(latitude) if latitude not in ("", None) else None
        lon = float(longitude) if longitude not in ("", None) else None
        area = float(land_area) if land_area not in ("", None) else None

        if lat is not None and not -90 <= lat <= 90:
            return json_error("Latitude must be between -90 and 90.")
        if lon is not None and not -180 <= lon <= 180:
            return json_error("Longitude must be between -180 and 180.")
    except (ValueError, TypeError):
        return json_error("Latitude, longitude and land area must be valid numbers.")

    farm_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    soil_type = str(data.get("soil_type", "Unknown"))[:80]
    water_availability = str(data.get("water_availability", "Unknown"))[:80]
    season = str(data.get("season", "Unknown"))[:80]
    current_crop = str(data.get("current_crop", ""))[:100]

    conn = get_db()
    try:
        with conn:
            conn.execute(
                """INSERT INTO farms (farm_id, user_id, farm_name, location, latitude, longitude,
                                      land_area, soil_type, water_availability, season, current_crop,
                                      created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (farm_id, g.user_id, name[:100], location[:200], lat, lon, area,
                 soil_type, water_availability, season, current_crop, now_iso, now_iso)
            )
        cur = conn.execute("SELECT * FROM farms WHERE farm_id = ?", (farm_id,))
        farm = row_to_dict(cur.fetchone())
        return jsonify({"farm": farm}), 201
    except Exception as exc:
        app.logger.exception("create_farm failed")
        return json_error(f"Could not save farm: {str(exc)[:200]}", 500)
    finally:
        conn.close()


def get_owned_farm(farm_id):
    conn = get_db()
    try:
        cur = conn.execute(
            "SELECT * FROM farms WHERE farm_id = ? AND user_id = ?",
            (farm_id, g.user_id)
        )
        return row_to_dict(cur.fetchone())
    finally:
        conn.close()


@app.get("/api/weather")
@auth_required
def weather():
    farm_id = request.args.get("farm_id", "")
    try:
        farm = get_owned_farm(farm_id)
        if not farm:
            return json_error("Farm not found.", 404)
        if farm.get("latitude") is None or farm.get("longitude") is None:
            return json_error("Add latitude and longitude to this farm first.")

        params = {
            "latitude": farm["latitude"],
            "longitude": farm["longitude"],
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "timezone": "auto",
            "forecast_days": 3
        }
        response = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=12)
        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})
        daily = data.get("daily", {})
        summary = " ".join(
            f"{day}: high {hi}°C, low {lo}°C, precipitation chance {rain}%"
            for day, hi, lo, rain in zip(
                daily.get("time", []),
                daily.get("temperature_2m_max", []),
                daily.get("temperature_2m_min", []),
                daily.get("precipitation_probability_max", [])
            )
        )
        fetched_at = datetime.now(timezone.utc).isoformat()
        snapshot = {
            "provider": "Open-Meteo",
            "current": current,
            "daily": daily,
            "timezone": data.get("timezone"),
            "fetched_at": fetched_at
        }

        conn = get_db()
        try:
            with conn:
                conn.execute(
                    """INSERT INTO weather_snapshots (snapshot_id, user_id, farm_id, provider, conditions, forecast_summary, fetched_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (str(uuid.uuid4()), g.user_id, farm_id, "Open-Meteo", json.dumps(snapshot), summary, fetched_at)
                )
        except Exception:
            app.logger.warning("Could not save weather snapshot", exc_info=True)
        finally:
            conn.close()

        return jsonify({"weather": snapshot, "forecast_summary": summary})
    except requests.RequestException:
        return json_error("Weather service could not be reached. Check your internet connection and try again.", 502)
    except Exception as exc:
        app.logger.exception("weather failed")
        return json_error(f"Could not load weather: {str(exc)[:180]}", 500)


def recommend_crops(farm):
    """Transparent demo rules; not validated agricultural advice."""
    soil = (farm.get("soil_type") or "unknown").lower()
    water = (farm.get("water_availability") or "unknown").lower()
    season = (farm.get("season") or "unknown").lower()
    location = (farm.get("location") or "").strip()
    candidates = [
        {"crop": "Groundnut", "score": 0, "reasons": [], "cautions": ["Confirm local variety and sowing window with the agriculture department."]},
        {"crop": "Millets (sorghum/foxtail millet)", "score": 0, "reasons": [], "cautions": ["Select a millet species and variety suited to local rainfall and soil."]},
        {"crop": "Paddy", "score": 0, "reasons": [], "cautions": ["Usually needs dependable water; check irrigation availability and local recommendations."]},
        {"crop": "Pulses (red gram/green gram)", "score": 0, "reasons": [], "cautions": ["Choose the pulse and variety based on local season and disease pressure."]},
    ]
    for item in candidates:
        crop = item["crop"].lower()
        if "sandy" in soil or "loam" in soil:
            if "groundnut" in crop:
                item["score"] += 3
                item["reasons"].append("Sandy or loamy soil can be worth evaluating for groundnut.")
            if "millet" in crop:
                item["score"] += 2
                item["reasons"].append("Millets may be worth evaluating in well-drained soils.")
        if "black" in soil or "clay" in soil:
            if "paddy" in crop:
                item["score"] += 2
                item["reasons"].append("Soil that retains water may suit paddy if water supply and field conditions are appropriate.")
            if "pulses" in crop:
                item["score"] += 1
                item["reasons"].append("Some pulses may be suitable depending on drainage and variety.")
        if "limited" in water.lower() or "rainfed" in water or "low" in water:
            if "millet" in crop:
                item["score"] += 3
                item["reasons"].append("Limited irrigation makes drought-tolerant options worth comparing.")
            if "groundnut" in crop:
                item["score"] += 1
                item["reasons"].append("Compare local groundnut options against expected rainfall and soil moisture.")
            if "paddy" in crop:
                item["score"] -= 3
                item["cautions"].append("Limited water may make paddy unsuitable without reliable rainfall or irrigation.")
        elif "good" in water or "assured" in water or "irrigation" in water:
            if "paddy" in crop:
                item["score"] += 2
                item["reasons"].append("Assured water makes paddy worth checking against local conditions.")
        if "kharif" in season or "monsoon" in season:
            if "groundnut" in crop or "pulses" in crop or "millet" in crop:
                item["score"] += 1
                item["reasons"].append("Season label indicates a monsoon-season option to verify locally.")
        elif "rabi" in season or "winter" in season:
            if "pulses" in crop or "millet" in crop:
                item["score"] += 1
                item["reasons"].append("Season label indicates an option to compare for the rabi season.")
        if not item["reasons"]:
            item["reasons"].append("Not enough farm-specific data to make a strong comparison; this is a general candidate only.")
        item["score"] = max(0, min(10, item["score"] + 2))

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return {
        "items": candidates,
        "factors": {
            "soil_type": farm.get("soil_type"),
            "water_availability": farm.get("water_availability"),
            "season": farm.get("season"),
            "location": location
        },
        "warnings": [
            "Illustrative demo ranking only; it is not validated for your specific district.",
            "Verify sowing dates, seed variety, soil conditions, water, pest risk and economics with local agricultural experts.",
            "No yield or profit is guaranteed."
        ]
    }


@app.post("/api/recommendations")
@auth_required
def create_recommendation():
    data = request.get_json(silent=True) or {}
    farm_id = str(data.get("farm_id", ""))
    try:
        farm = get_owned_farm(farm_id)
        if not farm:
            return json_error("Farm not found.", 404)
        result = recommend_crops(farm)
        result["farm_id"] = farm_id
        rec_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = get_db()
        try:
            with conn:
                conn.execute(
                    """INSERT INTO recommendations (recommendation_id, user_id, farm_id, candidate_crops,
                                                    ranking_factors, explanation, warnings, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (rec_id, g.user_id, farm_id, json.dumps(result["items"]),
                     json.dumps(result["factors"]),
                     "Illustrative rule-based ranking for prototype demonstration.",
                     json.dumps(result["warnings"]), now_iso)
                )
            result["recommendation_id"] = rec_id
        finally:
            conn.close()

        return jsonify({"recommendation": result})
    except Exception as exc:
        app.logger.exception("recommendation failed")
        return json_error(f"Could not generate suggestions: {str(exc)[:180]}", 500)


@app.get("/api/recommendations")
@auth_required
def list_recommendations():
    conn = get_db()
    try:
        cur = conn.execute(
            "SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (g.user_id,)
        )
        recommendations = [recommendation_to_dict(r) for r in cur.fetchall()]
        return jsonify({"recommendations": recommendations})
    except Exception as exc:
        app.logger.exception("list recommendations failed")
        return json_error(f"Could not load history: {str(exc)[:180]}", 500)
    finally:
        conn.close()


@app.post("/api/chat")
@auth_required
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    language = str(data.get("language", "English"))[:40]
    farm_id = str(data.get("farm_id", "")).strip()

    if not message:
        return json_error("Enter a question first.")
    if len(message) > 3000:
        return json_error("Please keep your question under 3,000 characters.")

    farm_context = "No farm selected. Ask general questions and state assumptions."
    if farm_id:
        try:
            farm = get_owned_farm(farm_id)
            if farm:
                farm_context = (
                    f"Farm name: {farm.get('farm_name')}; location: {farm.get('location')}; "
                    f"soil: {farm.get('soil_type')}; water availability: {farm.get('water_availability')}; "
                    f"season: {farm.get('season')}; current crop: {farm.get('current_crop') or 'not specified'}."
                )
        except Exception:
            app.logger.warning("Could not load farm context", exc_info=True)

    system_prompt = (
        "You are FarmPulse, a careful agricultural information assistant. Reply in the user's requested language: " + language + ". "
        "Be concise and practical. Use the provided farm context only as context, not as proof. State uncertainty and missing information. "
        "Do not claim guaranteed yield/profit or diagnose crop disease with certainty. Encourage verification with local agriculture officers for high-impact decisions. "
        "Do not invent live weather, market prices, seed stock, or official recommendations. Farm context: " + farm_context
    )
    try:
        tokenizer, model, device = load_huggingface_model()
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": message}]
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
        inputs = {key: value.to(device) for key, value in inputs.items()}
        with torch.inference_mode():
            output = model.generate(
                **inputs,
                max_new_tokens=max(32, min(HF_MAX_NEW_TOKENS, 768)),
                do_sample=True,
                temperature=0.3,
                top_p=0.85,
                pad_token_id=tokenizer.eos_token_id
            )
        generated = output[0][inputs["input_ids"].shape[1]:]
        answer = tokenizer.decode(generated, skip_special_tokens=True).strip()
        if not answer:
            return json_error("The local Hugging Face model returned an empty answer. Try again.", 502)

        now_iso = datetime.now(timezone.utc).isoformat()
        conn = get_db()
        try:
            with conn:
                conn.execute(
                    """INSERT INTO chat_history (message_id, user_id, farm_id, language, message_type, message_text, response_text, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (str(uuid.uuid4()), g.user_id, farm_id or None, language, "text", message, answer, now_iso)
                )
        except Exception:
            app.logger.warning("Could not save chat history", exc_info=True)
        finally:
            conn.close()

        return jsonify({"answer": answer, "model": HF_MODEL_ID, "language": language, "device": device})
    except (OSError, RuntimeError, ValueError) as exc:
        app.logger.exception("Hugging Face local model request failed")
        return json_error(f"Could not load/run the local Hugging Face model. Details: {str(exc)[:180]}", 503)
    except Exception as exc:
        app.logger.exception("Local AI request failed")
        return json_error(f"Local AI request failed: {str(exc)[:180]}", 502)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=True)

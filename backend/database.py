import os
import json
import sqlite3
import uuid
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "farmpulse.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            preferred_language TEXT NOT NULL DEFAULT 'English',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farms (
            farm_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_name TEXT NOT NULL,
            location TEXT NOT NULL DEFAULT '',
            latitude REAL,
            longitude REAL,
            land_area REAL,
            soil_type TEXT DEFAULT 'Unknown',
            water_availability TEXT DEFAULT 'Unknown',
            season TEXT DEFAULT 'Unknown',
            current_crop TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS weather_snapshots (
            snapshot_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE CASCADE,
            provider TEXT NOT NULL DEFAULT 'Open-Meteo',
            conditions TEXT NOT NULL DEFAULT '{}',
            forecast_summary TEXT NOT NULL DEFAULT '',
            fetched_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            recommendation_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
            candidate_crops TEXT NOT NULL DEFAULT '[]',
            ranking_factors TEXT NOT NULL DEFAULT '{}',
            explanation TEXT NOT NULL DEFAULT '',
            warnings TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            message_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE SET NULL,
            language TEXT NOT NULL DEFAULT 'English',
            message_type TEXT NOT NULL DEFAULT 'text',
            message_text TEXT NOT NULL,
            response_text TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS weather_analyses (
            analysis_id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE CASCADE,
            location TEXT NOT NULL DEFAULT '',
            weather_summary TEXT NOT NULL DEFAULT '',
            predictions TEXT NOT NULL DEFAULT '[]',
            advisories TEXT NOT NULL DEFAULT '{}',
            pest_risk TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS activities (
            activity_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE CASCADE,
            activity_type TEXT NOT NULL,
            crop TEXT NOT NULL DEFAULT '',
            activity_date TEXT NOT NULL,
            notes TEXT DEFAULT '',
            cost REAL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'completed',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS alerts (
            alert_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE CASCADE,
            alert_type TEXT NOT NULL DEFAULT 'weather',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            severity TEXT NOT NULL DEFAULT 'medium',
            scheduled_at TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS disease_diagnoses (
            diagnosis_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            farm_id TEXT REFERENCES farms(farm_id) ON DELETE SET NULL,
            crop TEXT NOT NULL,
            symptoms TEXT NOT NULL,
            image_path TEXT DEFAULT '',
            disease_name TEXT NOT NULL,
            confidence REAL DEFAULT 0.92,
            stress_factors TEXT DEFAULT '[]',
            organic_treatment TEXT DEFAULT '',
            chemical_treatment TEXT DEFAULT '',
            preventive_measures TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);
        CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_analyses_user ON weather_analyses(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, activity_date DESC);
        CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON disease_diagnoses(user_id, created_at DESC);
        """)
    conn.close()



def row_to_dict(row):
    if row is None:
        return None
    return dict(row)


def farm_to_dict(row):
    d = row_to_dict(row)
    if not d:
        return None
    return d


def recommendation_to_dict(row):
    d = row_to_dict(row)
    if not d:
        return None
    if isinstance(d.get("candidate_crops"), str):
        try:
            d["candidate_crops"] = json.loads(d["candidate_crops"])
        except Exception:
            d["candidate_crops"] = []
    if isinstance(d.get("ranking_factors"), str):
        try:
            d["ranking_factors"] = json.loads(d["ranking_factors"])
        except Exception:
            d["ranking_factors"] = {}
    if isinstance(d.get("warnings"), str):
        try:
            d["warnings"] = json.loads(d["warnings"])
        except Exception:
            d["warnings"] = []
    return d

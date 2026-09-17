"""Quick MongoDB connection test - prints the exact error if auth fails."""
import sys
import traceback

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError as e:
    print(f"[FATAL] Missing dependency: {e}")
    print("Run: venv\\Scripts\\pip install pymongo")
    sys.exit(2)

# Load .env manually so we see the *exact* URL the app will see
try:
    from dotenv import dotenv_values
except ImportError:
    dotenv_values = None

if dotenv_values:
    env = dotenv_values(".env")
    MONGODB_URL = env.get("MONGODB_URL")
    print("[env] Loaded .env via python-dotenv")
else:
    MONGODB_URL = None
    print("[env] python-dotenv not installed; relying on shell env")

if not MONGODB_URL:
    print("[FATAL] MONGODB_URL not set in .env or environment")
    sys.exit(2)

# Mask the password for safe printing, but keep length visible
def mask(url: str) -> str:
    if "@" not in url or "://" not in url:
        return url
    scheme, rest = url.split("://", 1)
    creds, host = rest.split("@", 1)
    if ":" in creds:
        user, _pw = creds.split(":", 1)
        creds_masked = f"{user}:{'*' * 8}"
    else:
        creds_masked = creds
    return f"{scheme}://{creds_masked}@{host}"

print(f"[cfg] MONGODB_URL = {mask(MONGODB_URL)}")
print(f"[cfg] URL length = {len(MONGODB_URL)} chars")

# Use a short timeout so a bad DNS/auth fails fast instead of hanging
try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
except PyMongoError as e:
    print(f"[FAIL] MongoClient() construction error: {type(e).__name__}: {e}")
    sys.exit(1)

print("[step] Pinging the deployment...")
try:
    client.admin.command("ping")
    print("[OK] Ping succeeded - credentials accepted, network reachable")
except PyMongoError as e:
    print(f"[FAIL] {type(e).__name__}: {e}")
    print("--- traceback ---")
    traceback.print_exc()
    sys.exit(1)

print("[step] Listing databases (validates user has listDatabases privilege)...")
try:
    dbs = client.list_database_names()
    print(f"[OK] Databases visible to this user: {dbs}")
except PyMongoError as e:
    print(f"[FAIL] list_database_names: {type(e).__name__}: {e}")
    sys.exit(1)

print("[OK] All checks passed.")

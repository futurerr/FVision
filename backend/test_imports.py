import sys
import os
print("Debug Full App Import...")
try:
    from app.main import app
    print("App main imported successfully!")
except Exception as e:
    print(f"Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()

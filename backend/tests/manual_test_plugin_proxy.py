import sys
import os
import json
import asyncio
import platform

# Add src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(os.path.dirname(current_dir), "src")
sys.path.append(src_dir)

# Fix for Windows and psycopg
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi.testclient import TestClient
from api.app import create_app

def test_plugin_proxy():
    print("Initializing app...")
    try:
        app = create_app()
    except Exception as e:
        print(f"Failed to create app: {e}")
        return

    print("Starting TestClient...")
    try:
        with TestClient(app) as client:
            # 1. Find plugin ID
            print("Fetching plugin list...")
            response = client.get("/api/v1/plugin/shop")
            if response.status_code != 200:
                print(f"Failed to get shop plugins: {response.status_code} - {response.text}")
                return

            plugins = response.json().get("data", [])
            target_plugin = next((p for p in plugins if p["name"] == "project_helper"), None)
            
            if not target_plugin:
                print("Plugin 'project_helper' not found in shop. Available plugins:", [p["name"] for p in plugins])
                return
                
            plugin_id = target_plugin["id"]
            print(f"Found plugin 'project_helper' with ID: {plugin_id}")
            
            # 2. Call proxy
            # Ensure database has correct config
            config = {
                "base_url": "https://api.siliconflow.cn/v1/",
                "api_key": "sk-dfenhfbjvvhxtuomoqfyhxrkvdizmlcpsjfwrvdlbzrckgfs",
                "model_name": "Qwen/Qwen3-30B-A3B-Instruct-2507"
            }
            
            # Update plugin config via API first
            print("Updating plugin config...")
            update_payload = {
                "config": config,
                "enabled": True
            }
            # The router uses PATCH for update, not PUT (based on previous router read)
            response = client.patch(f"/api/v1/plugin/{plugin_id}", json=update_payload)
            if response.status_code != 200:
                print(f"Failed to update plugin config: {response.status_code} - {response.text}")
                return
            print("Plugin config updated.")

            params = {
                "query": "Hello, this is a test.",
                "page_id": "test-session-123"
            }
            
            payload = {
                "params": params,
                # "config": config  # No longer passing config in payload
            }
            
            print(f"Calling proxy at /api/v1/plugin/proxy/{plugin_id}/call with payload...")
            
            # Use stream=True to handle streaming response
            with client.stream("POST", f"/api/v1/plugin/proxy/{plugin_id}/call", json=payload) as response:
                if response.status_code != 200:
                    print(f"Proxy call failed: {response.status_code} - {response.text}")
                    return
                
                print("Response headers:", response.headers)
                print("Reading stream...")
                
                try:
                    for line in response.iter_lines():
                        if line:
                            print(f"Received chunk: {line}")
                except Exception as e:
                    print(f"Error reading stream: {e}")

    except Exception as e:
        print(f"An error occurred during testing: {e}")

if __name__ == "__main__":
    test_plugin_proxy()

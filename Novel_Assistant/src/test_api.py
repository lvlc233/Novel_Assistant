import asyncio
import httpx

async def test_endpoints():
    base_url = "http://127.0.0.1:8001"
    
    # Wait for server to be ready
    print("Waiting for server to be ready...")
    async with httpx.AsyncClient() as client:
        for i in range(10):
            try:
                await client.get(f"{base_url}/document/debug")
                print("Server is ready!")
                break
            except:
                await asyncio.sleep(1)
                print(f"Retrying... {i+1}")
    
    # Test Debug Endpoint
    print("Testing /document/debug...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/document/debug")
            print(f"Debug Status: {resp.status_code}")
            print(f"Debug Response: {resp.json()}")
    except Exception as e:
        print(f"Debug failed: {e}")

    # Test Get Novels
    print("\nTesting /document/get_novels...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{base_url}/document/get_novels",
                json={"user_id": "0"}
            )
            print(f"Get Novels Status: {resp.status_code}")
            print(f"Get Novels Response: {resp.text}")
    except Exception as e:
        print(f"Get Novels failed: {e}")

    # Test Get Novels
    print("\nTesting /document/get_novels...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{base_url}/document/get_novels",
                json={"user_id": "0"}
            )
            print(f"Get Novels Status: {resp.status_code}")
            print(f"Get Novels Response: {resp.text}")
    except Exception as e:
        print(f"Get Novels failed: {e}")

    # Test Create Novel
    print("\nTesting /document/create_novel...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{base_url}/document/create_novel",
                json={"user_id": "0", "name": "Test Novel", "summary": "Test Summary"}
            )
            print(f"Create Novel Status: {resp.status_code}")
            print(f"Create Novel Response: {resp.text}")
    except Exception as e:
        print(f"Create Novel failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_endpoints())

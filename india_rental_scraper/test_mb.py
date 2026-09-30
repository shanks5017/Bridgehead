import asyncio
from pipeline import run_pipeline_async

async def main():
    res = await run_pipeline_async("Bangalore", ["magicbricks"])
    print(f"Total: {res['total_listings']}")
    
if __name__ == "__main__":
    asyncio.run(main())

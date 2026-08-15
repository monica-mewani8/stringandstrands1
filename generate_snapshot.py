import os
import json
import asyncio
from playwright.async_api import async_playwright

async def main():
    with open('src/data/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    html = "<html><body style='display:flex; flex-wrap:wrap; gap:10px;'>"
    
    # Generate grid
    for p in products:
        img_url = p['images'][0]
        # Skip the 10 we already did to save space
        if int(p['id'].split('-')[-1]) <= 10 and p['category'] == 'Earrings':
            continue
            
        file_path = os.path.abspath(f"public{img_url}").replace('\\', '/')
        html += f"""
        <div style='width: 150px; border: 1px solid #ccc; padding: 5px; text-align: center; font-family: sans-serif; font-size: 12px;'>
            <img src='file:///{file_path}' style='width: 100%; height: 120px; object-fit: contain;' />
            <br/>{p['id']}
        </div>
        """
    html += "</body></html>"
    
    with open('grid.html', 'w', encoding='utf-8') as f:
        f.write(html)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1200, 'height': 800})
        await page.goto(f"file:///{os.path.abspath('grid.html').replace('\\', '/')}")
        await page.screenshot(path='snapshot.jpg', full_page=True, quality=60, type='jpeg')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())

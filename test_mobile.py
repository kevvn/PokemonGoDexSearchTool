from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch()
        # Set viewport to simulate mobile
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        # Go to local server
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')

        # Take a screenshot of the new main layout
        page.screenshot(path='/tmp/main_mobile.png')

        # Click the FAB
        page.click('button[aria-label="Open filters"]')
        page.wait_for_timeout(500) # Wait for animation

        # Take a screenshot of the opened filter panel
        page.screenshot(path='/tmp/panel_mobile.png')

        browser.close()

if __name__ == "__main__":
    test()

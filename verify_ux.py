from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        try:
            page.goto("http://localhost:5173", timeout=10000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            browser.close()
            return

        # Wait for content to load
        try:
            page.wait_for_selector("text=PokéSearch", timeout=5000)
        except:
            print("Timeout waiting for 'PokéSearch'")
            page.screenshot(path="verification_error.png")
            browser.close()
            return

        # Focus on "Selected Only" toggle
        # It's in the header. We need to find where it is in the tab order.
        # The checkbox has class "peer". We want to focus it.
        # Since it's sr-only, we can't click it easily, but we can tab to it.

        print("Tabbing to toggle...")
        # Press Tab until we hit the checkbox
        # The checkbox is likely the first or second focusable element?
        # Let's inspect the page structure.
        # Header has h1 (not focusable), then the label with input.

        # Reset focus to body
        page.focus("body")

        # Tab 1: Should be the checkbox (since it's the first interactive element in header?)
        page.keyboard.press("Tab")
        time.sleep(0.5)
        page.screenshot(path="verification_toggle_focus.png")

        # Tab 2: Should be the first region button (Kanto)
        page.keyboard.press("Tab")
        time.sleep(0.5)
        page.screenshot(path="verification_region_focus.png")

        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    run()

from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle", timeout=60000)

        # 2. Type a search string
        print("Typing search string...")
        # Placeholder text might have changed - use partial match
        input_locator = page.locator("input[placeholder*='Search Pokemon']")
        input_locator.fill("water&shiny")
        input_locator.press("Enter")

        page.wait_for_timeout(500)

        # 3. Open Saved Menu
        print("Opening Saved Menu...")
        saved_btn = page.locator("button[title='Saved Searches']")
        saved_btn.click()

        # 4. Fill Label and Save
        print("Saving search...")
        label_input = page.get_by_placeholder("Label (e.g. 'My Team')")
        label_input.fill("Shiny Water")

        # Exact match for button name
        save_btn = page.get_by_role("button", name="Save", exact=True)
        save_btn.click()

        # 5. Verify it appears
        print("Verifying saved search...")
        page.wait_for_selector("text=Shiny Water")

        # 6. Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/improved_saved_ui.png")

        print("Verification complete!")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        page.screenshot(path="verification/error_improved.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

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
        input_locator = page.get_by_placeholder("Select Pokemon or type search string")
        input_locator.fill("fire")
        input_locator.press("Enter")

        # Wait for grid to update
        page.wait_for_timeout(1000)

        # 3. Open Saved Menu
        print("Opening Saved Menu...")
        # The button has title "Saved Searches"
        saved_btn = page.locator("button[title='Saved Searches']")
        saved_btn.click()

        # 4. Fill Label and Save
        print("Saving search...")
        label_input = page.get_by_placeholder("Label (e.g. 'My Team')")
        label_input.fill("Fire Types")

        # Use exact match for "Save" to differentiate from "Saved"
        save_btn = page.get_by_role("button", name="Save", exact=True)
        save_btn.click()

        # 5. Verify it appears
        print("Verifying saved search...")
        # Look for the label text
        page.wait_for_selector("text=Fire Types")

        # 6. Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/saved_search.png")

        print("Verification complete!")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)

import os
import sys
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:5173")


def test():
    console_errors = []
    page_errors = []
    external_qr_requests = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        page.on(
            "console",
            lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
        )
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.on(
            "request",
            lambda req: external_qr_requests.append(req.url)
            if "qrserver.com" in req.url
            else None,
        )

        # 1. Load default Triage Funnels tab at mobile 390x844
        page.goto(BASE_URL, wait_until="domcontentloaded")
        nav = page.locator('nav[aria-label="Primary workspace navigation"]')
        nav.wait_for(state="visible", timeout=5000)

        emergency_card = page.locator('[aria-label="30-Second Mid-Event Emergency Dump"]')
        emergency_card.wait_for(state="visible", timeout=5000)
        page.screenshot(path="/tmp/triage_mobile.png")

        # 2. Switch to Events & Trips tab (PR #59 Event DB + Temporal ageX-Y Slicer)
        nav.get_by_role("button", name="Events & Trips", exact=False).click()
        page.wait_for_timeout(250)
        page.screenshot(path="/tmp/events_mobile.png")

        # 3. Switch to Tag System tab & verify Quick-Hydrate walkthrough, 1-tap hydration Copy, and live Collision Linter
        nav.get_by_role("button", name="Tag System", exact=False).click()
        page.wait_for_selector('[aria-label="Tag system summary and actions"]')

        # Verify Quick-Hydrate walkthrough drawer opens and displays Stage 1..6
        walkthrough_section = page.locator('[aria-label="Quick-Hydrate Your Box (28-Tag Walkthrough)"]')
        walkthrough_section.wait_for(state="visible", timeout=5000)
        walkthrough_section.get_by_role("button", name="Quick-Hydrate Your Box", exact=False).click()
        page.wait_for_timeout(150)
        assert walkthrough_section.get_by_text("Stage 1: Events & Backgrounds").is_visible(), (
            "Expected Stage 1 heading in Quick-Hydrate walkthrough"
        )
        assert walkthrough_section.get_by_text("Stage 6: Operational Queues").is_visible(), (
            "Expected Stage 6 heading in Quick-Hydrate walkthrough"
        )

        # Verify 1-tap hydration Copy button on EV-ShBG tag card syncs to bottom search dock
        hydrate_copy_btn = page.locator('button[aria-label="Copy hydration query Shiny + Background for EV-ShBG"]')
        hydrate_copy_btn.scroll_into_view_if_needed()
        hydrate_copy_btn.click()
        page.wait_for_timeout(150)
        assert "Copied" in (hydrate_copy_btn.inner_text() or ""), (
            "Expected instant Copied feedback on Tag System hydration Copy button"
        )
        dock_input = page.locator('input[aria-label="Active Pokémon GO search string"]')
        assert dock_input.input_value() == "shiny&background&!#", (
            f"Expected bottom dock to sync hydration query 'shiny&background&!#', got: {dock_input.input_value()!r}"
        )
        page.screenshot(path="/tmp/tags_hydration_mobile.png")

        op_input = page.locator('input[aria-label="Custom name for OP-2xXfer"]')
        op_input.fill("shiny")
        page.wait_for_timeout(150)
        assert page.get_by_text("collides with a native Pokémon GO search keyword").is_visible(), (
            "Expected live collision linter error when naming a tag 'shiny'"
        )
        page.screenshot(path="/tmp/tags_collision_mobile.png")

        # Rename to a clean custom tag and verify Triage Funnels Mode D reflects it live
        op_input.fill("Xfer2x")
        page.wait_for_timeout(150)
        nav.get_by_role("button", name="Triage Funnels", exact=False).click()
        page.get_by_role("tab", name="Mode D", exact=False).click()
        assert page.get_by_text("#xfer2x&!favorite").is_visible(), (
            "Expected custom tag rename 'Xfer2x' to propagate to Mode D 2x Transfer query"
        )

        # Reset tags back to clean defaults
        nav.get_by_role("button", name="Tag System", exact=False).click()
        page.get_by_role("button", name="Reset All to Defaults").click()
        page.get_by_role("button", name="Click Again to Reset").click()

        # 4. Return to Triage Funnels and Load A6 Emergency Trash into Pokédex Builder
        nav.get_by_role("button", name="Triage Funnels", exact=False).click()
        emergency_card.wait_for(state="visible", timeout=5000)
        load_btn = emergency_card.get_by_role("button", name="Load in Builder").last
        load_btn.click()

        search_input = page.locator('input[aria-label="Active Pokémon GO search string"]')
        search_input.wait_for(state="visible", timeout=5000)
        loaded_val = search_input.input_value()
        assert "@3mov" in loaded_val and "!@3mov" not in loaded_val, (
            f"Expected safe @3mov shield in loaded A6 query, got: {loaded_val!r}"
        )
        assert "2-4attack,0-2defense,0-2hp" in loaded_val, (
            f"Expected De Morgan PvP shield in loaded A6 query, got: {loaded_val!r}"
        )
        page.screenshot(path="/tmp/builder_mobile.png")

        # 5. Verify Meta Quick-Select populates search string in Pokédex Builder
        page.get_by_role("button", name="GL Top 100").click()
        gl_value = search_input.input_value()
        assert gl_value and "," in gl_value, f"Expected GL Top 100 dex ranges, got: {gl_value!r}"

        # 6. Verify 100% offline client-side QR modal (zero api.qrserver.com requests)
        page.locator('button[aria-label="Show offline QR code"]').click()
        qr_img = page.locator('img[alt="Offline search query QR code"]')
        qr_img.wait_for(state="visible", timeout=5000)
        qr_src = qr_img.get_attribute("src") or ""
        assert qr_src.startswith("data:image/png;base64,"), (
            f"Expected inline offline data URL QR, got: {qr_src[:60]!r}"
        )
        assert len(external_qr_requests) == 0, (
            f"Unexpected external QR requests: {external_qr_requests}"
        )
        page.screenshot(path="/tmp/qr_mobile.png")
        page.locator('button[aria-label="Close QR modal"]').click()

        # 7. Open Mobile Filter By drawer & verify De Morgan shields render
        page.locator('button[aria-label="Open Filter By panel"]').click()
        page.wait_for_timeout(350)
        assert page.get_by_text("Exclude PvP IVs (De Morgan)").is_visible(), (
            "Expected De Morgan PvP shield toggle inside mobile Filter By panel"
        )
        page.screenshot(path="/tmp/panel_mobile.png")
        page.locator('button[aria-label="Close filters sheet"]').click()
        page.wait_for_timeout(200)

        browser.close()

    assert len(page_errors) == 0, f"Uncaught page errors: {page_errors}"
    assert len(console_errors) == 0, f"Console errors: {console_errors}"
    print("Mobile E2E verification PASSED (4-tab PoGO UI, 390x844, 0 console/page errors, 0 external QR calls).")


if __name__ == "__main__":
    try:
        test()
    except Exception as exc:
        print(f"Mobile E2E verification FAILED: {exc}", file=sys.stderr)
        sys.exit(1)

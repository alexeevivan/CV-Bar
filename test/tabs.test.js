import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initFlipButtons, initTabSystem } from "../src/js/components/tabs.js";

function renderTabs() {
	document.body.innerHTML = `
		<div data-tabs="wrapper">
			<div data-tabs="nav" data-flip-button="wrap">
				<button data-tabs="button" data-flip-button="button" class="active">One<span data-flip-button="bg"></span></button>
				<button data-tabs="button" data-flip-button="button">Two</button>
				<button data-tabs="button" data-flip-button="button">Three</button>
			</div>
			<div data-tabs="content-wrap">
				<section data-tabs="content-item"><h2 data-tabs-fade>One</h2><a href="#one">Open</a></section>
				<section data-tabs="content-item"><h2 data-tabs-fade>Two</h2><a href="#two">Open</a></section>
				<section data-tabs="content-item"><h2 data-tabs-fade>Three</h2><a href="#three">Open</a></section>
			</div>
			<div data-tabs="visual-wrap">
				<div data-tabs="visual-item">One visual</div>
				<div data-tabs="visual-item">Two visual</div>
				<div data-tabs="visual-item">Three visual</div>
			</div>
		</div>`;
}

function createGsapMock() {
	const completions = [];
	const chains = [];
	const timeline = vi.fn(({ onComplete }) => {
		const chain = {
			to: vi.fn(() => chain),
			fromTo: vi.fn(() => chain),
		};
		chains.push(chain);
		completions.push(onComplete);
		return chain;
	});
	return { gsap: { timeline, set: vi.fn() }, timeline, completions, chains };
}

describe("homepage tabs", () => {
	beforeEach(renderTabs);

	it("activates the first content and visual on initialization", () => {
		const { gsap } = createGsapMock();
		initTabSystem({ gsap });

		expect(document.querySelectorAll('[data-tabs="content-item"].active')).toHaveLength(1);
		expect(document.querySelector('[data-tabs="content-item"].active h2').textContent).toBe("One");
		expect(document.querySelectorAll('[data-tabs="visual-item"].active')).toHaveLength(1);
	});

	it("switches content and visual after the animation completes", () => {
		const { gsap, completions } = createGsapMock();
		initTabSystem({ gsap });
		completions.shift()();

		document.querySelectorAll('[data-tabs="button"]')[1].click();
		expect(document.querySelectorAll('[data-tabs="content-item"]')[1].classList.contains("active")).toBe(true);
		completions.shift()();

		expect(document.querySelectorAll('[data-tabs="content-item"].active')).toHaveLength(1);
		expect(document.querySelector('[data-tabs="content-item"].active h2').textContent).toBe("Two");
		expect(document.querySelectorAll('[data-tabs="visual-item"]')[1].classList.contains("active")).toBe(true);
	});

	it("ignores clicks while a tab animation is running", () => {
		const { gsap, timeline, completions } = createGsapMock();
		initTabSystem({ gsap });
		completions.shift()();

		const buttons = document.querySelectorAll('[data-tabs="button"]');
		buttons[1].click();
		buttons[2].click();

		expect(timeline).toHaveBeenCalledTimes(2);
		expect(buttons[1].classList.contains("active")).toBe(true);
		expect(buttons[2].classList.contains("active")).toBe(false);
	});

	// Value: protects=an already-active tab does not restart its animation; fails_when=the active-tab guard is removed; why_new=the rapid-click test covers only the isAnimating guard; seam=none; no_claim=real GSAP rendering (mocked timeline; unit only)
	it("does not restart the animation when the active tab is clicked", () => {
		const { gsap, timeline, completions } = createGsapMock();
		initTabSystem({ gsap });
		completions.shift()();

		document.querySelector('[data-tabs="button"].active').click();

		expect(timeline).toHaveBeenCalledTimes(1);
	});

	// Value: protects=invalid tab groups are ignored without partially wiring animations; fails_when=the count guard is removed or weakened; why_new=all existing fixtures have matching non-empty groups; seam=none; no_claim=browser layout or GSAP rendering (mocked timeline; unit only)
	it("ignores tab groups whose buttons, content, and visuals do not match", () => {
		document.querySelector('[data-tabs="visual-item"]').remove();
		const { gsap, timeline } = createGsapMock();

		initTabSystem({ gsap });
		document.querySelector('[data-tabs="button"]').click();

		expect(timeline).not.toHaveBeenCalled();
		expect(document.querySelectorAll('[data-tabs="content-item"].active')).toHaveLength(0);
	});

	it("moves the hover background and returns it to the active button", () => {
		const Flip = { getState: vi.fn(() => ({ state: true })), from: vi.fn() };
		initFlipButtons({ Flip });

		const buttons = document.querySelectorAll('[data-flip-button="button"]');
		const background = document.querySelector('[data-flip-button="bg"]');
		buttons[1].dispatchEvent(new MouseEvent("mouseenter"));
		expect(buttons[1].contains(background)).toBe(true);

		buttons[1].dispatchEvent(new MouseEvent("mouseleave"));
		expect(buttons[0].contains(background)).toBe(true);
		expect(Flip.from).toHaveBeenCalledTimes(2);
	});

	// Value: protects=keyboard focus moves the indicator and blur restores it to the active tab; fails_when=focus or blur listeners are removed; why_new=the pointer test exercises only mouseenter and mouseleave; seam=none; no_claim=visual interpolation by real GSAP Flip (mocked Flip; unit only)
	it("moves the background for keyboard focus and restores it on blur", () => {
		const Flip = { getState: vi.fn(() => ({ state: true })), from: vi.fn() };
		initFlipButtons({ Flip });

		const buttons = document.querySelectorAll('[data-flip-button="button"]');
		const background = document.querySelector('[data-flip-button="bg"]');
		buttons[2].dispatchEvent(new FocusEvent("focus"));
		expect(buttons[2].contains(background)).toBe(true);

		buttons[2].dispatchEvent(new FocusEvent("blur"));
		expect(buttons[0].contains(background)).toBe(true);
		expect(Flip.from).toHaveBeenCalledTimes(2);
	});

	// Value: protects=a tab nav without an indicator remains inert; fails_when=the missing-background guard is removed; why_new=existing Flip tests always render an indicator; seam=none; no_claim=real page markup validity or GSAP rendering (mocked Flip; unit only)
	it("does not attach Flip behavior when the background is missing", () => {
		document.querySelector('[data-flip-button="bg"]').remove();
		const Flip = { getState: vi.fn(), from: vi.fn() };
		initFlipButtons({ Flip });

		const button = document.querySelector('[data-flip-button="button"]');
		button.dispatchEvent(new MouseEvent("mouseenter"));
		button.dispatchEvent(new FocusEvent("focus"));

		expect(Flip.getState).not.toHaveBeenCalled();
		expect(Flip.from).not.toHaveBeenCalled();
	});
});

describe("page metadata", () => {
	// Value: protects=every public page declares English content for assistive technology; fails_when=a page reverts to the old Russian language tag; why_new=no existing test reads page-level language metadata; seam=none; no_claim=translation quality or rendered browser accessibility beyond the lang contract
	it.each(["index.html", "design.html", "bar-setup.html", "training.html"])("declares English on %s", (page) => {
		const source = readFileSync(resolve(process.cwd(), "src", page), "utf8");

		expect(source).toMatch(/<html lang="en">/);
	});
});

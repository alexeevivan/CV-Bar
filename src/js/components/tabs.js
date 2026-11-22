export function initFlipButtons({ root = document, Flip }) {
	const wrappers = root.querySelectorAll('[data-flip-button="wrap"]');

	wrappers.forEach((wrapper) => {
		const buttons = wrapper.querySelectorAll('[data-flip-button="button"]');
		const background = wrapper.querySelector('[data-flip-button="bg"]');

		if (!background) return;

		const moveBackground = (button) => {
			const state = Flip.getState(background);
			button.appendChild(background);
			Flip.from(state, { duration: 0.4 });
		};

		const resetBackground = () => {
			const activeButton = wrapper.querySelector('[data-flip-button="button"].active');
			if (activeButton) moveBackground(activeButton);
		};

		buttons.forEach((button) => {
			button.addEventListener("mouseenter", () => moveBackground(button));
			button.addEventListener("focus", () => moveBackground(button));
			button.addEventListener("mouseleave", resetBackground);
			button.addEventListener("blur", resetBackground);
		});
	});
}

export function initTabSystem({ root = document, gsap }) {
	const wrappers = root.querySelectorAll('[data-tabs="wrapper"]');

	wrappers.forEach((wrapper) => {
		const buttons = wrapper.querySelectorAll('[data-tabs="nav"] [data-tabs="button"]');
		const contentItems = wrapper.querySelectorAll('[data-tabs="content-wrap"] [data-tabs="content-item"]');
		const visualItems = wrapper.querySelectorAll('[data-tabs="visual-wrap"] [data-tabs="visual-item"]');

		if (!buttons.length || buttons.length !== contentItems.length || buttons.length !== visualItems.length) return;

		let activeButton = buttons[0];
		let activeContent = contentItems[0];
		let activeVisual = visualItems[0];
		let isAnimating = false;

		function switchTab(index, initial = false) {
			if (!initial && (isAnimating || buttons[index] === activeButton)) return;
			isAnimating = true;

			const outgoingContent = activeContent;
			const incomingContent = contentItems[index];
			const outgoingVisual = activeVisual;
			const incomingVisual = visualItems[index];
			const outgoingLines = outgoingContent.querySelectorAll("[data-tabs-fade]");
			const incomingLines = incomingContent.querySelectorAll("[data-tabs-fade]");

			const timeline = gsap.timeline({
				defaults: { ease: "power3.inOut" },
				onComplete: () => {
					if (!initial) {
						outgoingContent.classList.remove("active");
						outgoingVisual.classList.remove("active");
						gsap.set(outgoingContent, { opacity: 1 });
						gsap.set(outgoingContent.querySelectorAll("a"), { autoAlpha: 1 });
					}
					activeContent = incomingContent;
					activeVisual = incomingVisual;
					isAnimating = false;
				},
			});

			incomingContent.classList.add("active");
			incomingVisual.classList.add("active");

			if (!initial) {
				timeline
					.to(outgoingContent, { opacity: 0, duration: 0.6 }, 0)
					.to(outgoingLines, { y: "-2em", autoAlpha: 0, duration: 0.6 }, 0)
					.to(outgoingContent.querySelectorAll("a"), { autoAlpha: 0, duration: 0.3 }, 0)
					.to(outgoingVisual, { autoAlpha: 0, xPercent: 3 }, 0);
			}

			timeline
				.fromTo(incomingContent, { opacity: 0 }, { opacity: 1, duration: 0.3 }, initial ? 0 : 0.35)
				.fromTo(incomingLines, { y: "2em", autoAlpha: 0 }, { y: "0em", autoAlpha: 1, stagger: 0.075 }, initial ? 0 : 0.4)
				.fromTo(incomingVisual, { autoAlpha: 0, xPercent: 3 }, { autoAlpha: 1, xPercent: 0 }, "<");

			activeButton.classList.remove("active");
			buttons[index].classList.add("active");
			activeButton = buttons[index];
		}

		switchTab(0, true);
		gsap.set(contentItems[0].querySelectorAll("a"), { autoAlpha: 1 });

		buttons.forEach((button, index) => {
			button.addEventListener("click", () => switchTab(index));
		});

		contentItems[0].classList.add("active");
		visualItems[0].classList.add("active");
		buttons[0].classList.add("active");
	});
}

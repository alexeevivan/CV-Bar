import '../styles/styles.scss';
import '../styles/responsive/main-max_768.scss';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import { initFlipButtons, initTabSystem } from "./components/tabs.js";

gsap.registerPlugin(ScrollTrigger, Flip, CustomEase);

window.addEventListener("load", () => {
	gsap
		.timeline({
			scrollTrigger: {
				trigger: ".wrapper",
				start: "top top",
				end: "+=150%",
				pin: true,
				scrub: true,
				invalidateOnRefresh: true
			}
		})
		.to(".slogan", {
			opacity: 0,
		})
		.to(".mainimage", {
			scale: 2,
			z: 550,
			transformOrigin: "center center",
			ease: "power1.inOut"
		})
		.to(
			".section.second",
			{
				opacity: 0,
				scale: 1,
				transformOrigin: "center center",
				ease: "power1.inOut",
			},
			"<"
		);
});

CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1")

gsap.defaults({
	ease: "osmo-ease",
	duration: 0.8,
});

document.addEventListener("DOMContentLoaded", () => {
	initTabSystem({ gsap });
	initFlipButtons({ Flip });
})

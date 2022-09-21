import { useSpring } from "@react-spring/web";
import { useEffect, useState } from "react";

import { UsePullToRefreshOptions } from "./types";

/**
 * A hook to provide animation logic for a pull to load component.
 * It has to be used with animated components via @react-spring/web (i.e. a.div or animated.div).
 * The native scroll behavior is tracked and the spring api is controlled accordingly.
 *
 * @param {number} threshold
 * - The minimum distance a negative scroll has to reach to call the onEnd callback.
 * @param {UsePullToRefreshOptions} options
 * @param {() => void} onEnd
 * - The callback that is called when the scroll movement springs back to 0 and the threshold was
 * reached. It is important that the callback is memoized to prevent unwanted behavior. If the
 * parent component can't guarantee the memoization then the ancestor that defines it has to memoize
 * it.
 * @returns {{active: boolean, y: SpringValue<number>}}
 *
 * @example
 * 	const { active, y } = usePullToLoad(threshold, {
 * 	  onEnd: useCallback(()=> {
 * 	    console.log("reload");
 * 	  }, [])
 * 	});
 * */
export default function usePullToRefresh(
	threshold: number,
	{ onEnd }: UsePullToRefreshOptions = {}
) {
	const [{ y }, api] = useSpring(() => ({ y: 0 }));

	// Active during spring while the movement is greater than the threshold
	const [active, setActive] = useState(false);

	useEffect(() => {
		// Flags to keep track of the behavior
		let isDown = false;
		let wasDown = false;
		let isValid = false;
		// Reference
		let animationFrame;

		// Handle the original scroll and control the spring api
		function handleScroll() {
			function scroll() {
				const movementY = window.scrollY * -1;
				// Fast decision means fast renders
				// We only need to listen when the movement causes an offset of lower than 0
				// That behavior only happens in standalone iOS, therefore the code below should
				// only affect iOS in standalone mode
				if (movementY < 0) {
					return;
				}
				// When the user scrolled and let go
				// And the movement has reached 0
				if (wasDown && !isDown) {
					wasDown = false;
					// Then spring back to 0
					api.start({
						y: 0,
						immediate: false,
						config: { tension: 620, friction: 55 },
					});
					// Only call the onEnd if the threshold was reached
					// And the movement has reached 0
					if (isValid && movementY === 0) {
						isValid = false;
						if (onEnd) {
							onEnd();
						}
					}
				}
				// When the user is scrolling
				else if (isDown) {
					// Then track the movement
					api.start({
						y: Math.max(0, movementY),
						immediate: true,
					});
				}
				// Set the active flag
				setActive(wasDown && movementY > threshold);
			}
			// Performance tweak
			animationFrame = window.requestAnimationFrame(scroll);
		}

		// When the user touch starts
		function handleTouchStart() {
			// Then the down flags are activated
			isDown = true;
			wasDown = true;
		}

		// When the user touch ends
		function handleTouchEnd() {
			// Then the down flag is deactivated
			isDown = false;
			// And the movement is validated
			// It has to be greater than the threshold
			isValid = -window.scrollY > threshold;
		}

		window.addEventListener("scroll", handleScroll, { passive: true });
		window.addEventListener("touchstart", handleTouchStart);
		window.addEventListener("touchend", handleTouchEnd);

		return () => {
			window.cancelAnimationFrame(animationFrame);
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchend", handleTouchEnd);
		};
	}, [threshold, onEnd, api]);

	return { active, y };
}

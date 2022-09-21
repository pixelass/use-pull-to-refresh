/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { renderHook } from "@testing-library/react-hooks";

import usePullToRefresh from "../";

describe("usePullToRefresh", () => {
	it("should return active", () => {
		const { result } = renderHook(() => usePullToRefresh(96));
		expect(result.current).toHaveProperty("active");
	});
	it("should return y", () => {
		const { result } = renderHook(() => usePullToRefresh(96));
		expect(result.current).toHaveProperty("y");
	});
});

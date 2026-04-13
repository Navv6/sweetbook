import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/page";

describe("LandingPage", () => {
  it("renders the page shell", () => {
    render(<LandingPage />);

    expect(screen.getByRole("main")).toBeDefined();
  });
});

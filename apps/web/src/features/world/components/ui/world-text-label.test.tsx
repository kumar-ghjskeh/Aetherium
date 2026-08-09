import React from "react";
import { describe, expect, it } from "vitest";

import { normalizeWorldLabelText, wrapWorldLabelText } from "./world-text-label";

describe("world text labels", () => {
  it("normalizes nested React content without exposing markup", () => {
    expect(
      normalizeWorldLabelText(
        <>
          Project <strong>Dock</strong> {4}
        </>
      )
    ).toBe("Project Dock 4");
  });

  it("wraps labels deterministically and limits long copy", () => {
    const measure = (value: string) => value.length;
    expect(wrapWorldLabelText("one two three four", 8, measure)).toEqual([
      "one two",
      "three",
      "four"
    ]);
    expect(wrapWorldLabelText("one two three four five six", 8, measure, 2)).toEqual([
      "one two",
      "three..."
    ]);
  });
});

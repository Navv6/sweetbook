import { describe, expect, it } from "vitest";

import {
  buildTemplateFamilies,
  normalizeTemplateVariants,
  resolveTemplateFamilyForPublish,
} from "@/lib/template-catalog";

describe("template catalog", () => {
  it("groups variants by theme and infers a missing theme from the template name", () => {
    const variants = normalizeTemplateVariants([
      {
        templateUid: "cover-a4",
        templateName: "알림장B_표지",
        bookSpecUid: "PHOTOBOOK_A4_SC",
        templateKind: "cover",
      },
      {
        templateUid: "story-a4",
        templateName: "알림장B_내지a_contain",
        bookSpecUid: "PHOTOBOOK_A4_SC",
        templateKind: "content",
      },
      {
        templateUid: "gallery-a4",
        templateName: "알림장B_내지_gallery",
        bookSpecUid: "PHOTOBOOK_A4_SC",
        templateKind: "content",
        theme: null,
      },
    ]);

    const families = buildTemplateFamilies(variants);

    expect(families).toHaveLength(1);
    expect(families[0]?.theme).toBe("알림장B");
    expect(families[0]?.templateCount).toBe(3);
  });

  it("resolves cover, story, and gallery templates for a selected family", () => {
    const families = buildTemplateFamilies(
      normalizeTemplateVariants([
        {
          templateUid: "cover-a5",
          templateName: "일기장A_표지",
          bookSpecUid: "PHOTOBOOK_A5_SC",
          templateKind: "cover",
          theme: "일기장A",
        },
        {
          templateUid: "story-a5",
          templateName: "일기장A_내지a_contain",
          bookSpecUid: "PHOTOBOOK_A5_SC",
          templateKind: "content",
          theme: "일기장A",
        },
        {
          templateUid: "gallery-a5",
          templateName: "일기장A_내지_gallery",
          bookSpecUid: "PHOTOBOOK_A5_SC",
          templateKind: "content",
          theme: "일기장A",
        },
      ]),
    );

    const resolved = resolveTemplateFamilyForPublish(
      families,
      "일기장A",
      "PHOTOBOOK_A5_SC",
    );

    expect(resolved?.cover?.id).toBe("cover-a5");
    expect(resolved?.story?.id).toBe("story-a5");
    expect(resolved?.gallery?.id).toBe("gallery-a5");
  });
});

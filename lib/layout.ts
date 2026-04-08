import type {
  ContentItem,
  GeneratedPage,
  GeneratedSection,
  Project,
} from "@/types/project";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const chunkItems = (items: ContentItem[], sectionCount: number) => {
  const size = Math.ceil(items.length / sectionCount);
  const groups: ContentItem[][] = [];

  for (let index = 0; index < sectionCount; index += 1) {
    const start = index * size;
    const group = items.slice(start, start + size);

    if (group.length > 0) {
      groups.push(group);
    }
  }

  return groups;
};

const baseCopy = [
  {
    title: "\uCCAB \uC7A5\uBA74",
    intro:
      "\uCC98\uC74C\uC758 \uACF5\uAE30\uC640 \uC2DC\uC120\uC744 \uB2E4\uC2DC \uB530\uB77C\uAC00\uBA70 \uC2A4\uD1A0\uB9AC\uC758 \uBB38\uC744 \uC5EC\uB294 \uC11C\uB450\uC785\uB2C8\uB2E4.",
    cover:
      "\uD55C \uAD8C\uC758 \uD754\uC801\uC73C\uB85C \uB0A8\uAE30\uB294 \uC6B0\uB9AC\uC758 \uC2DC\uAC04",
  },
  {
    title: "\uBA38\uBB3C \uC790\uB9AC",
    intro:
      "\uBA38\uBB3C\uB800\uB358 \uC7A5\uC18C\uC758 \uC628\uB3C4\uC640 \uBD84\uC704\uAE30\uB97C \uC0AC\uC9C4 \uC0AC\uC774\uC5D0 \uCC28\uBD84\uD788 \uC5EE\uC2B5\uB2C8\uB2E4.",
    cover:
      "\uAE30\uC5B5\uC774 \uBA38\uBB34\uB294 \uD48D\uACBD\uC744 \uB2E4\uC2DC \uD3BC\uCCD0\uBCF4\uB294 \uD398\uC774\uC9C0",
  },
  {
    title: "\uCC9C\uCC9C\uD55C \uAE30\uB85D",
    intro:
      "\uBE68\uB9AC \uD758\uB7EC\uAC04 \uC2DC\uAC04\uB4E4\uC744 \uB2E4\uC2DC \uB290\uB9B4 \uC218 \uC788\uB3C4\uB85D \uD638\uD761\uC744 \uB0A8\uAE30\uBA70 \uC815\uB9AC\uD569\uB2C8\uB2E4.",
    cover:
      "\uC0AC\uC9C4\uACFC \uBB38\uC7A5\uC774 \uC11C\uB85C\uB97C \uBCF4\uC644\uD558\uB294 \uC5D0\uB514\uD1A0\uB9AC\uC5BC \uAD6C\uC131",
  },
  {
    title: "\uBC14\uB2E4\uC758 \uB05D",
    intro:
      "\uD558\uB8E8\uAC00 \uBB34\uB974\uC775\uB294 \uC21C\uAC04\uC744 \uD55C \uC7A5\uBA74\uC529 \uACF5\uB4E4\uC5EC \uB9E4\uB05D \uD398\uC774\uC9C0\uB85C \uC774\uC5B4\uAC11\uB2C8\uB2E4.",
    cover:
      "\uC791\uC740 \uD30C\uB3D9\uC774 \uB9CC\uB4E4\uC5B4 \uB0B8 \uC5EC\uC6B4\uC744 \uC870\uC6A9\uD788 \uBB36\uC5B4\uB0C5\uB2C8\uB2E4.",
  },
];

export const reorderGeneratedSections = (
  sections: GeneratedSection[],
  order: string[],
) => {
  const mapped = new Map(sections.map((section) => [section.id, section]));
  const reordered = order
    .map((sectionId) => mapped.get(sectionId))
    .filter((section): section is GeneratedSection => Boolean(section));

  let pageNumber = 1;

  return reordered.map((section) => ({
    ...section,
    pages: section.pages.map((page) => ({
      ...page,
      pageNumber: pageNumber++,
    })),
  }));
};

export const generateLayout = async (
  project: Pick<
    Project,
    "id" | "title" | "coverImageUrl" | "templateId" | "bookSpecId"
  >,
  contentItems: ContentItem[],
  copyOverrides?: Array<{ title: string; intro: string; cover: string }>,
): Promise<GeneratedSection[]> => {
  const items = contentItems.filter((item) => item.kind === "image");
  const sectionCount = clamp(Math.ceil(Math.max(items.length, 6) / 2), 3, 6);
  const grouped = chunkItems(items, sectionCount);
  const copy = copyOverrides && copyOverrides.length > 0 ? copyOverrides : baseCopy;
  const sections: GeneratedSection[] = [];
  let pageNumber = 1;

  grouped.forEach((group, index) => {
    const sectionId = `section_${index + 1}`;
    const copyItem = copy[index % copy.length];
    const pages: GeneratedPage[] = [];

    if (index === 0) {
      pages.push({
        id: `${sectionId}_cover`,
        sectionId,
        pageNumber: pageNumber++,
        kind: "cover",
        templateKey: "cover",
        elements: [
          {
            id: `${sectionId}_cover_image`,
            type: "image",
            slotKey: "cover",
            contentItemId: group[0]?.id,
            imageUrl:
              project.coverImageUrl ??
              group[0]?.imageUrl ??
              "/demo/cover-morning.svg",
            crop: { x: 0.5, y: 0.45, scale: 1.1 },
          },
          {
            id: `${sectionId}_cover_title`,
            type: "text",
            role: "coverTitle",
            value: project.title,
          },
          {
            id: `${sectionId}_cover_subtitle`,
            type: "text",
            role: "coverSubtitle",
            value: copyItem.cover,
          },
        ],
      });
    }

    pages.push({
      id: `${sectionId}_intro`,
      sectionId,
      pageNumber: pageNumber++,
      kind: "intro",
      templateKey: "intro",
      elements: [
        {
          id: `${sectionId}_title`,
          type: "text",
          role: "sectionTitle",
          value: copyItem.title,
        },
        {
          id: `${sectionId}_intro_copy`,
          type: "text",
          role: "intro",
          value: copyItem.intro,
        },
      ],
    });

    group.forEach((item, itemIndex) => {
      const templateKey =
        itemIndex % 3 === 0 ? "focus" : itemIndex % 3 === 1 ? "story" : "gallery";

      pages.push({
        id: `${sectionId}_content_${itemIndex + 1}`,
        sectionId,
        pageNumber: pageNumber++,
        kind: "content",
        templateKey,
        elements:
          templateKey === "gallery"
            ? [
                {
                  id: `${sectionId}_${item.id}_gallery_a`,
                  type: "image",
                  slotKey: "galleryA",
                  contentItemId: group[itemIndex]?.id,
                  imageUrl: group[itemIndex]?.imageUrl ?? item.imageUrl ?? "",
                  crop: { x: 0.5, y: 0.5, scale: 1 },
                },
                {
                  id: `${sectionId}_${item.id}_gallery_b`,
                  type: "image",
                  slotKey: "galleryB",
                  contentItemId: group[itemIndex + 1]?.id,
                  imageUrl:
                    group[itemIndex + 1]?.imageUrl ??
                    item.imageUrl ??
                    "/demo/archive-wall.svg",
                  crop: { x: 0.5, y: 0.5, scale: 1 },
                },
                {
                  id: `${sectionId}_${item.id}_caption`,
                  type: "text",
                  role: "caption",
                  value: `${item.title} \uC55E\uB4A4\uB85C \uC774\uC5B4\uC9C0\uB294 \uC2DC\uAC04`,
                },
              ]
            : [
                {
                  id: `${sectionId}_${item.id}_image`,
                  type: "image",
                  slotKey: templateKey === "focus" ? "hero" : "support",
                  contentItemId: item.id,
                  imageUrl: item.imageUrl ?? "/demo/travel-note.svg",
                  crop: { x: 0.5, y: 0.5, scale: 1 },
                },
                {
                  id: `${sectionId}_${item.id}_body`,
                  type: "text",
                  role: "body",
                  value:
                    templateKey === "focus"
                      ? `${item.title}\uB97C \uC911\uC2EC\uC73C\uB85C \uC7A5\uBA74\uC758 \uBB34\uB4DC\uB97C \uD06C\uAC8C \uBCF4\uC5EC\uC8FC\uB294 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4.`
                      : `${item.title}\uC744 \uAE30\uC900\uC73C\uB85C \uC9E7\uC740 \uC124\uBA85\uACFC \uC2DC\uAC04\uC758 \uD750\uB984\uC744 \uC5EE\uC5B4 \uAC11\uB2C8\uB2E4.`,
                },
              ],
      });
    });

    sections.push({
      id: sectionId,
      title: copyItem.title,
      intro: copyItem.intro,
      coverText: copyItem.cover,
      pages,
    });
  });

  return sections;
};

export function extractHashtags(body: string) {
  return [
    ...new Set(
      (body.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((value) =>
        value.slice(1).toLowerCase(),
      ),
    ),
  ];
}

export function parseHashtagInput(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((item) => item.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function mergeHashtags(...groups: string[][]) {
  return [...new Set(groups.flat().map((item) => item.trim().toLowerCase()))];
}

export function buildPostShareMessage(input: {
  authorName: string;
  body: string;
  listingTitle?: string | null;
}) {
  const trimmedBody = input.body.trim();
  const preview =
    trimmedBody.length > 140 ? `${trimmedBody.slice(0, 137).trimEnd()}...` : trimmedBody;

  return [
    `${input.authorName} shared a post on WheresMyDorm.`,
    preview,
    input.listingTitle ? `Linked listing: ${input.listingTitle}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

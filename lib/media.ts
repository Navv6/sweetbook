export const sanitizeDisplayImageUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/demo/") || value.startsWith("/theme/")) {
    return value;
  }

  return undefined;
};

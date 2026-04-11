const PHP_CURRENCY_FORMATTER = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatCurrency(price: string | number): string {
  return PHP_CURRENCY_FORMATTER.format(Number(price));
}

export function formatCompactPrice(price: string | number): string {
  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return String(price);
  }

  return numericPrice >= 1000
    ? `PHP ${(numericPrice / 1000).toFixed(1)}k`
    : `PHP ${numericPrice}`;
}

export function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) {
    return "--";
  }

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return `${firstName?.[0] ?? "W"}${lastName?.[0] ?? "D"}`.toUpperCase();
}

import type { DiscoverySearchPreset } from "@/types/discovery";
import type { MapSortOption, PropertyTypeFilter } from "@/types/map";
import type { AppRouter } from "@wheresmydorm/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

export const DISCOVERY_STORAGE_KEY = "wmd.discovery.presets";
export const MAX_DISCOVERY_PRESETS = 10;

type RouterOutputs = inferRouterOutputs<AppRouter>;
type RecentSearchItem = RouterOutputs["listings"]["recentSearches"][number];
type SavedSearchItem = RouterOutputs["listings"]["savedSearches"][number];

type BuildDiscoveryPresetArgs = {
  createdAt?: string;
  label?: string;
  maxPrice?: number;
  propertyTypes?: PropertyTypeFilter[];
  query: string;
  serverId?: string;
  sortBy?: MapSortOption;
};

export function createDiscoveryPresetKey(input: {
  maxPrice?: number;
  propertyTypes?: PropertyTypeFilter[];
  query?: string | null;
  sortBy?: MapSortOption;
}) {
  const normalizedQuery = input.query?.trim() ?? "";
  const propertyTypes = input.propertyTypes ?? [];

  return `${normalizedQuery || "preset"}-${input.sortBy ?? "best_match"}-${
    input.maxPrice ?? "any"
  }-${propertyTypes.join("-")}`.toLowerCase();
}

export function buildDiscoveryPreset({
  createdAt,
  label,
  maxPrice,
  propertyTypes = [],
  query,
  serverId,
  sortBy = "best_match",
}: BuildDiscoveryPresetArgs): DiscoverySearchPreset {
  const normalizedQuery = query.trim();
  const propertySummary =
    propertyTypes.length > 0 ? propertyTypes[0].replaceAll("_", " ") : null;

  return {
    id: createDiscoveryPresetKey({
      maxPrice,
      propertyTypes,
      query: normalizedQuery,
      sortBy,
    }),
    serverId,
    createdAt: createdAt ?? new Date().toISOString(),
    label:
      (label ?? normalizedQuery) ||
      (maxPrice
        ? `Under ${maxPrice.toLocaleString()}`
        : propertySummary
          ? `Browse ${propertySummary}`
          : "Nearby places"),
    maxPrice,
    propertyTypes,
    query: normalizedQuery,
    sortBy,
  };
}

export function dedupeDiscoveryPresets(presets: DiscoverySearchPreset[]) {
  const seen = new Set<string>();
  const deduped: DiscoverySearchPreset[] = [];

  for (const preset of presets) {
    if (seen.has(preset.id)) {
      continue;
    }

    seen.add(preset.id);
    deduped.push(preset);
  }

  return deduped.slice(0, MAX_DISCOVERY_PRESETS);
}

function normalizePropertyTypes(values: unknown): PropertyTypeFilter[] {
  return Array.isArray(values)
    ? values.filter((value): value is PropertyTypeFilter => typeof value === "string")
    : [];
}

export function mapRecentSearchToPreset(item: RecentSearchItem): DiscoverySearchPreset {
  const filters = item.filters as
    | {
        maxPrice?: number | null;
        propertyTypes?: PropertyTypeFilter[];
        sortBy?: MapSortOption | null;
      }
    | null;

  return buildDiscoveryPreset({
    createdAt: String(item.createdAt),
    label: item.query ? `Search: ${item.query}` : "Recent search",
    maxPrice: filters?.maxPrice ?? undefined,
    propertyTypes: normalizePropertyTypes(filters?.propertyTypes),
    query: item.query ?? "",
    serverId: item.id,
    sortBy: filters?.sortBy ?? "best_match",
  });
}

export function mapSavedSearchToPreset(item: SavedSearchItem): DiscoverySearchPreset {
  const filters = item.filters as
    | {
        maxPrice?: number | null;
        propertyTypes?: PropertyTypeFilter[];
        query?: string | null;
        sortBy?: MapSortOption | null;
      }
    | null;

  return buildDiscoveryPreset({
    createdAt: String(item.createdAt),
    label: item.label,
    maxPrice: filters?.maxPrice ?? undefined,
    propertyTypes: normalizePropertyTypes(filters?.propertyTypes),
    query: filters?.query ?? "",
    serverId: item.id,
    sortBy: filters?.sortBy ?? "best_match",
  });
}

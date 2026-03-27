import type { DiscoverySearchPreset } from "@/types/discovery";
import type { MapSortOption, PropertyTypeFilter } from "@/types/map";

export const DISCOVERY_STORAGE_KEY = "wmd.discovery.presets";
export const MAX_DISCOVERY_PRESETS = 10;

type BuildDiscoveryPresetArgs = {
  label?: string;
  maxPrice?: number;
  propertyTypes?: PropertyTypeFilter[];
  query: string;
  sortBy?: MapSortOption;
};

export function buildDiscoveryPreset({
  label,
  maxPrice,
  propertyTypes = [],
  query,
  sortBy = "best_match",
}: BuildDiscoveryPresetArgs): DiscoverySearchPreset {
  const normalizedQuery = query.trim();
  const propertySummary =
    propertyTypes.length > 0 ? propertyTypes[0].replaceAll("_", " ") : null;

  return {
    id: `${normalizedQuery || "preset"}-${sortBy}-${maxPrice ?? "any"}-${propertyTypes.join("-")}`.toLowerCase(),
    createdAt: new Date().toISOString(),
    label:
      label ??
      normalizedQuery ??
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

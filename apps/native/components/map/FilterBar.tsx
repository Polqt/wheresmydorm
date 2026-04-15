import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { QuotaUpgradeBanner } from "@/components/ui/quota-upgrade-banner";
import type {
  MapFilters,
  MapSortOption,
  PropertyTypeFilter,
} from "@/types/map";
import { formatCurrency } from "@/utils/profile";

const propertyTypes: PropertyTypeFilter[] = [
  "dorm",
  "apartment",
  "bedspace",
  "condo",
  "boarding_house",
  "studio",
];

const amenities = [
  "wifi",
  "aircon",
  "parking",
  "cctv",
  "laundry",
  "study_area",
];
const ratingOptions = [3.5, 4, 4.5];
const distanceOptions = [500, 1000, 2000, 4000];
const sortOptions: Array<{ label: string; value: MapSortOption }> = [
  { label: "Best match", value: "best_match" },
  { label: "Nearest", value: "nearest" },
  { label: "Top rated", value: "top_rated" },
  { label: "Lowest price", value: "price_low_to_high" },
  { label: "Highest price", value: "price_high_to_low" },
  { label: "Newest", value: "newest" },
];
const availabilityOptions = [
  { label: "Any time", value: undefined },
  { label: "Now", value: new Date().toISOString() },
  {
    label: "Within 7 days",
    value: new Date(Date.now() + 7 * 86400000).toISOString(),
  },
  {
    label: "Within 30 days",
    value: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
] as const;
const SNAP_POINTS = ["22%", "54%", "88%"];

function formatBudget(value?: number) {
  return value === undefined ? "Any" : formatCurrency(value);
}

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1000
    ? `${distanceMeters / 1000} km`
    : `${distanceMeters} m`;
}

export function FilterBar({
  advancedFiltersEnabled,
  filters,
  remainingFinds,
  resultCount,
  isOpen,
  onOpenChange,
  onChange,
  onReset,
}: {
  advancedFiltersEnabled: boolean;
  filters: MapFilters;
  remainingFinds: number;
  resultCount: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (filters: MapFilters) => void;
  onReset: () => void;
}) {
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => SNAP_POINTS, []);

  useEffect(() => {
    const sheet = bottomSheetRef.current;

    if (!sheet) {
      return;
    }

    if (isOpen) {
      sheet.snapToIndex(1);
      return;
    }

    sheet.close();
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.28}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={BOTTOM_SHEET_BACKGROUND_STYLE}
      bottomInset={insets.bottom}
      enablePanDownToClose
      handleIndicatorStyle={BOTTOM_SHEET_HANDLE_STYLE}
      onClose={() => onOpenChange(false)}
    >
      <BottomSheetScrollView contentContainerStyle={SHEET_CONTENT_STYLE}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-extrabold text-[#0F172A] text-[22px]">
              Filter & sort
            </Text>
            <Text className="mt-1 text-[13px] text-slate-600 leading-5">
              {resultCount} properties match your last search.
            </Text>
          </View>
          <Pressable
            className="mt-0.5 h-8 w-8 items-center justify-center rounded bg-[#F0EBE3]"
            onPress={() => onOpenChange(false)}
          >
            <Text className="font-bold text-[13px] text-slate-600">X</Text>
          </Pressable>
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Sort
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {sortOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              onPress={() =>
                onChange({
                  ...filters,
                  sortBy: option.value,
                })
              }
              selected={filters.sortBy === option.value}
            />
          ))}
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Price range
        </Text>
        <QuotaUpgradeBanner
          isPaid={advancedFiltersEnabled}
          remainingFinds={remainingFinds}
        />
        <View className="gap-[10px]">
          <Stepper
            disabled={!advancedFiltersEnabled}
            label="Min monthly rent"
            onDecrease={() =>
              onChange({
                ...filters,
                minPrice: Math.max(0, (filters.minPrice ?? 0) - 500),
              })
            }
            onIncrease={() =>
              onChange({
                ...filters,
                minPrice: (filters.minPrice ?? 0) + 500,
              })
            }
            value={filters.minPrice}
          />
          <Stepper
            disabled={!advancedFiltersEnabled}
            label="Max monthly rent"
            onDecrease={() =>
              onChange({
                ...filters,
                maxPrice: Math.max(500, (filters.maxPrice ?? 12000) - 500),
              })
            }
            onIncrease={() =>
              onChange({
                ...filters,
                maxPrice: (filters.maxPrice ?? 12000) + 500,
              })
            }
            value={filters.maxPrice}
          />
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Property type
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {propertyTypes.map((propertyType) => {
            const isSelected = filters.propertyTypes.includes(propertyType);
            return (
              <Chip
                disabled={!advancedFiltersEnabled}
                key={propertyType}
                label={propertyType.replaceAll("_", " ")}
                onPress={() =>
                  onChange({
                    ...filters,
                    propertyTypes: isSelected
                      ? filters.propertyTypes.filter(
                          (item) => item !== propertyType,
                        )
                      : [...filters.propertyTypes, propertyType],
                  })
                }
                selected={isSelected}
              />
            );
          })}
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Amenities
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {amenities.map((amenity) => {
            const isSelected = filters.amenities.includes(amenity);
            return (
              <Chip
                disabled={!advancedFiltersEnabled}
                key={amenity}
                label={amenity.replaceAll("_", " ")}
                onPress={() =>
                  onChange({
                    ...filters,
                    amenities: isSelected
                      ? filters.amenities.filter((item) => item !== amenity)
                      : [...filters.amenities, amenity],
                  })
                }
                selected={isSelected}
              />
            );
          })}
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Minimum rating
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {ratingOptions.map((rating) => (
            <Chip
              disabled={!advancedFiltersEnabled}
              key={rating}
              label={`${rating}+ stars`}
              onPress={() =>
                onChange({
                  ...filters,
                  minRating: filters.minRating === rating ? undefined : rating,
                })
              }
              selected={filters.minRating === rating}
            />
          ))}
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Distance
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {distanceOptions.map((distance) => (
            <Chip
              key={distance}
              label={formatDistance(distance)}
              onPress={() => onChange({ ...filters, distanceMeters: distance })}
              selected={filters.distanceMeters === distance}
            />
          ))}
        </View>

        <Text className="mt-6 mb-[10px] font-extrabold text-[#0F172A] text-[13px] uppercase tracking-[0.8px]">
          Availability
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {availabilityOptions.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              onPress={() =>
                onChange({
                  ...filters,
                  availableBy: option.value,
                })
              }
              selected={filters.availableBy === option.value}
            />
          ))}
        </View>

        <View className="mt-7 flex-row gap-[10px]">
          <Pressable
            className="items-center justify-center rounded border border-[#DDD8CF] px-[18px]"
            onPress={onReset}
          >
            <Text className="font-bold text-[#706A5F] text-[14px]">Reset</Text>
          </Pressable>
          <Pressable
            className="flex-1 items-center rounded bg-[#0B2D23] py-[14px]"
            onPress={() => onOpenChange(false)}
          >
            <Text className="font-extrabold text-[14px] text-white">
              Apply filters
            </Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function Stepper({
  disabled,
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  disabled?: boolean;
  label: string;
  value?: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View className="rounded border border-slate-200 bg-white p-[14px]">
      <Text className="font-bold text-[#706A5F] text-[11px] uppercase tracking-[0.8px]">
        {label}
      </Text>
      <View className="mt-[10px] flex-row items-center justify-between">
        <Pressable
          className={`h-8 w-8 items-center justify-center rounded bg-[#EEF5F1] ${
            disabled ? "opacity-45" : ""
          }`}
          disabled={disabled}
          onPress={onDecrease}
        >
          <Text className="font-bold text-[#0B2D23] text-[18px]">-</Text>
        </Pressable>
        <Text
          className={`font-bold text-[15px] ${
            disabled ? "text-[#9E9890]" : "text-[#0F172A]"
          }`}
        >
          {formatBudget(value)}
        </Text>
        <Pressable
          className={`h-8 w-8 items-center justify-center rounded bg-[#EEF5F1] ${
            disabled ? "opacity-45" : ""
          }`}
          disabled={disabled}
          onPress={onIncrease}
        >
          <Text className="font-bold text-[#0B2D23] text-[18px]">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  disabled,
  label,
  selected,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`rounded border px-3 py-2 ${
        selected ? "border-[#0B2D23] bg-[#EEF5F1]" : "border-[#DDD8CF] bg-white"
      } ${disabled ? "opacity-45" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        className={`font-bold text-[12px] capitalize ${
          disabled
            ? "text-[#9E9890]"
            : selected
              ? "text-[#0B2D23]"
              : "text-[#706A5F]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const BOTTOM_SHEET_BACKGROUND_STYLE = {
  backgroundColor: "#FFFDF9",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
} as const;

const BOTTOM_SHEET_HANDLE_STYLE = {
  backgroundColor: "#D8D0C6",
  width: 44,
} as const;

const SHEET_CONTENT_STYLE = {
  paddingHorizontal: 20,
  paddingBottom: 40,
} as const;

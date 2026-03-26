import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MapFilters, PropertyTypeFilter } from "@/types/map";
import { formatCurrency } from "@/utils/profile";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SHEET_WIDTH = SCREEN_WIDTH * 0.84;

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
const distanceOptions = [1000, 2000, 4000, 8000];

function formatBudget(value?: number) {
  return value === undefined ? "Any" : formatCurrency(value);
}

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1000
    ? `${distanceMeters / 1000} km`
    : `${distanceMeters} m`;
}

export function FilterBar({
  filters,
  resultCount,
  isOpen,
  onOpenChange,
  onChange,
  onReset,
}: {
  filters: MapFilters;
  resultCount: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (filters: MapFilters) => void;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const translateX = useSharedValue(SHEET_WIDTH);

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      translateX.value = withTiming(0, { duration: 280 });
    } else {
      translateX.value = withTiming(SHEET_WIDTH, { duration: 240 }, (finished) => {
        if (finished) runOnJS(setModalVisible)(false);
      });
    }
  }, [isOpen]);

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Modal
      animationType="none"
      transparent
      visible={modalVisible}
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.modalFrame}>
        <Pressable style={styles.backdrop} onPress={() => onOpenChange(false)} />

        <Animated.View style={[styles.sheet, { paddingTop: insets.top + 24 }, sheetAnimStyle]}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Filters</Text>
                <Text style={styles.sheetBody}>
                  {resultCount} properties match your search
                </Text>
              </View>
              <Pressable onPress={() => onOpenChange(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Price range</Text>
            <View style={styles.priceGrid}>
              <Stepper
                label="Min monthly rent"
                value={filters.minPrice}
                onDecrease={() =>
                  onChange({ ...filters, minPrice: Math.max(0, (filters.minPrice ?? 0) - 500) })
                }
                onIncrease={() =>
                  onChange({ ...filters, minPrice: (filters.minPrice ?? 0) + 500 })
                }
              />
              <Stepper
                label="Max monthly rent"
                value={filters.maxPrice}
                onDecrease={() =>
                  onChange({ ...filters, maxPrice: Math.max(500, (filters.maxPrice ?? 12000) - 500) })
                }
                onIncrease={() =>
                  onChange({ ...filters, maxPrice: (filters.maxPrice ?? 12000) + 500 })
                }
              />
            </View>

            <Text style={styles.sectionTitle}>Property type</Text>
            <View style={styles.optionGrid}>
              {propertyTypes.map((propertyType) => {
                const isSelected = filters.propertyTypes.includes(propertyType);
                return (
                  <Chip
                    key={propertyType}
                    label={propertyType.replaceAll("_", " ")}
                    selected={isSelected}
                    onPress={() =>
                      onChange({
                        ...filters,
                        propertyTypes: isSelected
                          ? filters.propertyTypes.filter((t) => t !== propertyType)
                          : [...filters.propertyTypes, propertyType],
                      })
                    }
                  />
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.optionGrid}>
              {amenities.map((amenity) => {
                const isSelected = filters.amenities.includes(amenity);
                return (
                  <Chip
                    key={amenity}
                    label={amenity.replaceAll("_", " ")}
                    selected={isSelected}
                    onPress={() =>
                      onChange({
                        ...filters,
                        amenities: isSelected
                          ? filters.amenities.filter((a) => a !== amenity)
                          : [...filters.amenities, amenity],
                      })
                    }
                  />
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Minimum rating</Text>
            <View style={styles.optionGrid}>
              {ratingOptions.map((rating) => (
                <Chip
                  key={rating}
                  label={`${rating}+ stars`}
                  selected={filters.minRating === rating}
                  onPress={() =>
                    onChange({
                      ...filters,
                      minRating: filters.minRating === rating ? undefined : rating,
                    })
                  }
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.optionGrid}>
              {distanceOptions.map((distance) => (
                <Chip
                  key={distance}
                  label={formatDistance(distance)}
                  selected={filters.distanceMeters === distance}
                  onPress={() => onChange({ ...filters, distanceMeters: distance })}
                />
              ))}
            </View>

            <View style={styles.footer}>
              <Pressable onPress={onReset} style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>Reset</Text>
              </Pressable>
              <Pressable onPress={() => onOpenChange(false)} style={styles.primaryAction}>
                <Text style={styles.primaryActionText}>Apply filters</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value?: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDecrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatBudget(value)}</Text>
        <Pressable onPress={onIncrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalFrame: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.30)",
  },
  sheet: {
    width: "84%",
    backgroundColor: "#fffdf9",
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
  },
  sheetBody: {
    marginTop: 4,
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#F0EBE3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  closeBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  priceGrid: {
    gap: 10,
  },
  stepper: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  stepperLabel: {
    color: "#706A5F",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  stepperRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperButton: {
    height: 32,
    width: 32,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF5F1",
  },
  stepperButtonText: {
    color: "#0B2D23",
    fontSize: 18,
    fontWeight: "700",
  },
  stepperValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDD8CF",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: "#0B2D23",
    backgroundColor: "#EEF5F1",
  },
  chipText: {
    color: "#706A5F",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#0B2D23",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: "#0B2D23",
    paddingVertical: 14,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDD8CF",
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    color: "#706A5F",
    fontSize: 14,
    fontWeight: "700",
  },
});

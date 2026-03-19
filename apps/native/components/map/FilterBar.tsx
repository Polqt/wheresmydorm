import { MapFilters, PropertyTypeFilter } from "@/types/map";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";


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

function formatCurrency(value?: number) {
  if (value === undefined) {
    return "Any";
  }

  return `P${value.toLocaleString("en-PH")}`;
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
  const activeLabel = [
    filters.propertyTypes.length
      ? `${filters.propertyTypes.length} type`
      : null,
    filters.amenities.length ? `${filters.amenities.length} amenity` : null,
    filters.minRating ? `${filters.minRating}+ stars` : null,
    formatDistance(filters.distanceMeters),
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <View style={styles.bar}>
        <Text style={styles.heading}>Map filters</Text>
        <Text style={styles.subheading}>{resultCount} properties nearby</Text>
        <View style={styles.pillRow}>
          <Pressable
            onPress={() => onOpenChange(true)}
            style={styles.primaryPill}
          >
            <Text style={styles.primaryPillText}>Tune search</Text>
          </Pressable>
          <View style={styles.secondaryPill}>
            <Text style={styles.secondaryPillText}>{activeLabel}</Text>
          </View>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isOpen}
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={styles.modalFrame}>
          <Pressable
            style={styles.backdrop}
            onPress={() => onOpenChange(false)}
          />
          <View style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Text style={styles.sheetTitle}>Filter listings</Text>
              <Text style={styles.sheetBody}>
                Narrow the map by budget, property type, amenities, rating, and
                search radius.
              </Text>

              <Text style={styles.sectionTitle}>Price range</Text>
              <View style={styles.priceGrid}>
                <Stepper
                  label="Min monthly rent"
                  value={filters.minPrice}
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
                />
                <Stepper
                  label="Max monthly rent"
                  value={filters.maxPrice}
                  onDecrease={() =>
                    onChange({
                      ...filters,
                      maxPrice: Math.max(
                        500,
                        (filters.maxPrice ?? 12000) - 500,
                      ),
                    })
                  }
                  onIncrease={() =>
                    onChange({
                      ...filters,
                      maxPrice: (filters.maxPrice ?? 12000) + 500,
                    })
                  }
                />
              </View>

              <Text style={styles.sectionTitle}>Property type</Text>
              <View style={styles.optionGrid}>
                {propertyTypes.map((propertyType) => {
                  const isSelected =
                    filters.propertyTypes.includes(propertyType);

                  return (
                    <Chip
                      key={propertyType}
                      label={propertyType.replaceAll("_", " ")}
                      selected={isSelected}
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
                            ? filters.amenities.filter(
                                (item) => item !== amenity,
                              )
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
                        minRating:
                          filters.minRating === rating ? undefined : rating,
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
                    onPress={() =>
                      onChange({
                        ...filters,
                        distanceMeters: distance,
                      })
                    }
                  />
                ))}
              </View>

              <View style={styles.footer}>
                <Pressable onPress={onReset} style={styles.secondaryAction}>
                  <Text style={styles.secondaryActionText}>Reset</Text>
                </Pressable>
                <Pressable
                  onPress={() => onOpenChange(false)}
                  style={styles.primaryAction}
                >
                  <Text style={styles.primaryActionText}>Apply filters</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatCurrency(value)}</Text>
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
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      <Text
        style={[styles.chipText, selected ? styles.chipTextSelected : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255, 253, 248, 0.94)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  heading: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  subheading: {
    marginTop: 2,
    color: "#475569",
    fontSize: 12,
  },
  pillRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  primaryPill: {
    borderRadius: 999,
    backgroundColor: "#0f766e",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryPillText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryPill: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryPillText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  modalFrame: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.34)",
  },
  sheet: {
    width: "86%",
    backgroundColor: "#fffdf8",
    paddingTop: 24,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
  },
  sheetBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 24,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  priceGrid: {
    marginTop: 12,
    gap: 12,
  },
  stepper: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 14,
  },
  stepperLabel: {
    color: "#475569",
    fontSize: 12,
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
    height: 34,
    width: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfeff",
  },
  stepperButtonText: {
    color: "#155e75",
    fontSize: 20,
    fontWeight: "700",
  },
  stepperValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  optionGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: "#0f766e",
    backgroundColor: "#ccfbf1",
  },
  chipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  chipTextSelected: {
    color: "#134e4a",
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#0f172a",
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
});

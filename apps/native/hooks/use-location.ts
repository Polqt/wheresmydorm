import * as Location from "expo-location";
import { useEffect, useState } from "react";

import { DISCOVERY_FALLBACK_COORDS } from "@/services/listings";
import type { LocationState } from "@/types/location";

const FALLBACK = DISCOVERY_FALLBACK_COORDS;

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: FALLBACK,
    label: "Using Bacolod as the launch city fallback.",
    isReady: false,
  });

  useEffect(() => {
    let cancelled = false;

    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (cancelled) return;
        if (status !== "granted") {
          setState({
            coords: FALLBACK,
            label: "Location off — showing Bacolod listings instead.",
            isReady: true,
          });
          return;
        }
        return Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      })
      .then((position) => {
        if (cancelled || !position) return;
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          label: "Centered on your current location.",
          isReady: true,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            coords: FALLBACK,
            label: "GPS unavailable — using Bacolod for now.",
            isReady: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

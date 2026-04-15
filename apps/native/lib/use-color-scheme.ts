type ColorScheme = "light" | "dark";

type ColorSchemeState = {
  colorScheme: ColorScheme;
  isDarkColorScheme: boolean;
  setColorScheme: () => void;
  toggleColorScheme: () => void;
};

export function useColorScheme(): ColorSchemeState {
  const colorScheme = "light" as ColorScheme;

  return {
    colorScheme,
    isDarkColorScheme: false,
    setColorScheme: () => {
      console.warn("WheresMyDorm currently ships in light mode only.");
    },
    toggleColorScheme: () => {
      console.warn("WheresMyDorm currently ships in light mode only.");
    },
  };
}

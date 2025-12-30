import { useWindowDimensions } from "react-native";

export const useDeviceLayout = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return {
    isTablet,
    isMobile: !isTablet,
  };
};

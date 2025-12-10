// src/hooks/useScrollToTop.ts
// Custom hook for scroll-to-top functionality
import { useRef, useState, useCallback, RefObject } from "react";
import { FlatList, ScrollView, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const SCROLL_THRESHOLD = 200; // Show button after scrolling 200px

export interface UseScrollToTopReturn {
  scrollRef: RefObject<FlatList | ScrollView>;
  showScrollToTop: boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollToTop: () => void;
}

export const useScrollToTop = (): UseScrollToTopReturn => {
  const scrollRef = useRef<FlatList | ScrollView>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > SCROLL_THRESHOLD);
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      if ("scrollToOffset" in scrollRef.current) {
        // FlatList
        (scrollRef.current as FlatList).scrollToOffset({ offset: 0, animated: true });
      } else {
        // ScrollView
        (scrollRef.current as ScrollView).scrollTo({ y: 0, animated: true });
      }
    }
  }, []);

  return {
    scrollRef,
    showScrollToTop,
    handleScroll,
    scrollToTop,
  };
};


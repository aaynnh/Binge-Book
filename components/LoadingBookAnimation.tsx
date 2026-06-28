import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const loadingBookImage = require("../assets/images/loading-book-closed.png");

export function LoadingBookAnimation() {
  const pageProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pageProgress, {
        duration: 1250,
        easing: Easing.inOut(Easing.cubic),
        toValue: 1,
        useNativeDriver: false,
      })
    );

    animation.start();

    return () => {
      animation.stop();
      pageProgress.setValue(0);
    };
  }, [pageProgress]);

  const firstPageStyle = buildPageSweep(pageProgress);
  const secondPageStyle = buildPageSweep(
    pageProgress.interpolate({
      inputRange: [0, 0.48, 0.49, 1],
      outputRange: [0.52, 1, 0, 0.51],
    })
  );
  const shadowStyle = {
    opacity: pageProgress.interpolate({
      inputRange: [0, 0.35, 0.75, 1],
      outputRange: [0, 0.2, 0.08, 0],
    }),
    transform: [
      {
        scaleX: pageProgress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.72, 1.1, 0.72],
        }),
      },
    ],
  };

  return (
    <View accessibilityLabel="Book pages loading animation" style={styles.wrap}>
      <View style={styles.bookStage}>
        <Image contentFit="cover" source={loadingBookImage} style={styles.image} />
        <Animated.View style={[styles.pageShadow, shadowStyle]} />

        <Animated.View style={[styles.turningPage, styles.backPage, secondPageStyle]}>
          <View style={styles.pageEdge} />
          <View style={styles.pageLine} />
          <View style={[styles.pageLine, styles.pageLineShort]} />
        </Animated.View>

        <Animated.View style={[styles.turningPage, firstPageStyle]}>
          <View style={styles.pageEdge} />
          <View style={styles.pageLine} />
          <View style={[styles.pageLine, styles.pageLineShort]} />
        </Animated.View>
      </View>
    </View>
  );
}

function buildPageSweep(phase: Animated.AnimatedInterpolation<number> | Animated.Value) {
  return {
    opacity: phase.interpolate({ inputRange: [0, 0.06, 0.86, 1], outputRange: [0, 1, 1, 0] }),
    left: phase.interpolate({ inputRange: [0, 0.34, 0.72, 1], outputRange: [64, 47, 28, 24] }),
    top: phase.interpolate({ inputRange: [0, 0.34, 0.72, 1], outputRange: [42, 28, 38, 46] }),
    transform: [
      {
        rotateZ: phase.interpolate({
          inputRange: [0, 0.34, 0.72, 1],
          outputRange: ["5deg", "-50deg", "-116deg", "-132deg"],
        }),
      },
      { scaleX: phase.interpolate({ inputRange: [0, 0.42, 1], outputRange: [0.78, 1.08, 0.82] }) },
      { scaleY: phase.interpolate({ inputRange: [0, 0.42, 1], outputRange: [0.96, 1.04, 0.94] }) },
    ],
  };
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    height: 166,
    justifyContent: "center",
    marginBottom: 4,
    width: 190,
  },
  bookStage: {
    borderRadius: 38,
    height: 156,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#F1D99D",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    width: 156,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  pageShadow: {
    backgroundColor: "#071323",
    borderRadius: 999,
    height: 58,
    left: 61,
    position: "absolute",
    top: 53,
    width: 58,
  },
  turningPage: {
    backgroundColor: "#FFF8E8",
    borderColor: "rgba(241,217,157,0.94)",
    borderRadius: 16,
    borderWidth: 2,
    height: 78,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 8,
    position: "absolute",
    width: 54,
    zIndex: 12,
  },
  backPage: {
    backgroundColor: "#FFF0CF",
    zIndex: 11,
  },
  pageEdge: {
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 58,
    opacity: 0.58,
    position: "absolute",
    right: 5,
    width: 3,
  },
  pageLine: {
    backgroundColor: "#071323",
    borderRadius: 999,
    height: 4,
    opacity: 0.16,
    width: "100%",
  },
  pageLineShort: {
    marginTop: 7,
    width: "68%",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useAppAppearance } from "@/services/appearance";
import { getProfile } from "@/services/profile";

type AppBottomNavProps = {
  active: "discover" | "list" | "profile" | "reading";
  profileAvatarUri?: string;
};

const navItems = [
  {
    icon: "person-outline" as const,
    id: "profile" as const,
    label: "Profile",
    path: "/(tabs)/profile" as const,
  },
  {
    icon: "albums-outline" as const,
    id: "discover" as const,
    label: "Discover",
    path: "/deck" as const,
  },
  {
    icon: "bookmark-outline" as const,
    id: "list" as const,
    label: "My List",
    path: "/(tabs)/list" as const,
  },
  {
    icon: "timer-outline" as const,
    id: "reading" as const,
    label: "10 min",
    path: "/reading-mode" as const,
  },
];

export function AppBottomNav({ active, profileAvatarUri }: AppBottomNavProps) {
  const { colors, isDark } = useAppAppearance();
  const [savedAvatarUri, setSavedAvatarUri] = useState("");
  const avatarUri = profileAvatarUri ?? savedAvatarUri;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      getProfile().then((profile) => {
        if (isMounted) {
          setSavedAvatarUri(profile.avatarUri ?? "");
        }
      });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <View
      style={[
        styles.navShell,
        {
          backgroundColor: colors.navBackground,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}>
      {navItems.map((item) => {
        const isActive = active === item.id;

        return (
          <TouchableOpacity
            activeOpacity={0.82}
            key={item.id}
            onPress={() => {
              if (!isActive) {
                router.replace(item.path as never);
              }
            }}
            style={[styles.navItem, isActive && { backgroundColor: colors.accent }]}>
            {item.id === "profile" && avatarUri ? (
              <Image
                accessibilityLabel="Your profile picture"
                contentFit="cover"
                source={{ uri: avatarUri }}
                style={[styles.profileAvatar, isActive && styles.profileAvatarActive]}
              />
            ) : (
              <Ionicons
                name={isActive ? activeIcon(item.icon) : item.icon}
                size={22}
                color={isActive ? colors.accentText : isDark ? "#526173" : colors.navInactive}
              />
            )}
            <Text
              style={[
                styles.navText,
                { color: isDark ? "#526173" : colors.navInactive },
                isActive && { color: colors.accentText, fontWeight: "900" },
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function activeIcon(icon: keyof typeof Ionicons.glyphMap) {
  const filledIcons: Partial<Record<keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap>> = {
    "albums-outline": "albums",
    "bookmark-outline": "bookmark",
    "person-outline": "person",
    "timer-outline": "timer",
  };

  return filledIcons[icon] ?? icon;
}

const styles = StyleSheet.create({
  navShell: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(7,19,35,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    justifyContent: "space-between",
    marginBottom: 6,
    maxWidth: 390,
    padding: 6,
    shadowColor: "#071323",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    gap: 2,
    minHeight: 54,
    justifyContent: "center",
  },
  navText: {
    color: "#6D7280",
    fontSize: 10,
    fontWeight: "800",
  },
  profileAvatar: {
    borderColor: "rgba(7,19,35,0.14)",
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    width: 24,
  },
  profileAvatarActive: {
    borderColor: "#071323",
    borderWidth: 2,
  },
});

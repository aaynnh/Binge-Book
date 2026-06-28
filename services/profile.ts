import AsyncStorage from "@react-native-async-storage/async-storage";

const profileKey = "bingebook.profile.v1";

export type ReaderProfile = {
  age?: string;
  avatarUri?: string;
  bio?: string;
  city?: string;
  discord?: string;
  displayName: string;
  favoriteGenres: string[];
  instagram?: string;
  pronouns?: string;
  readingLevel: string;
  snapchat?: string;
  username: string;
  weeklyGoal: string;
};

export const defaultProfile: ReaderProfile = {
  age: "",
  avatarUri: "",
  bio: "",
  city: "",
  discord: "",
  displayName: "",
  favoriteGenres: ["Mystery", "Romance"],
  pronouns: "",
  readingLevel: "Beginner",
  instagram: "",
  snapchat: "",
  username: "",
  weeklyGoal: "3",
};

export async function getProfile(): Promise<ReaderProfile> {
  const rawProfile = await AsyncStorage.getItem(profileKey);

  if (!rawProfile) {
    return defaultProfile;
  }

  try {
    return { ...defaultProfile, ...(JSON.parse(rawProfile) as Partial<ReaderProfile>) };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: ReaderProfile) {
  const cleanProfile: ReaderProfile = {
    ...profile,
    bio: profile.bio?.trim(),
    discord: cleanHandle(profile.discord),
    displayName: profile.displayName.trim(),
    instagram: cleanHandle(profile.instagram),
    snapchat: cleanHandle(profile.snapchat),
    username: profile.username.trim().replace(/^@/, ""),
  };

  await AsyncStorage.setItem(profileKey, JSON.stringify(cleanProfile));
  return cleanProfile;
}

function cleanHandle(handle: string | undefined) {
  return handle?.trim().replace(/^@/, "") ?? "";
}

export function isProfileComplete(profile: ReaderProfile) {
  return Boolean(profile.displayName.trim() && profile.username.trim());
}

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ProfileAvatarPickerProps = {
  initials: string;
  onChange: (uri: string) => void | Promise<void>;
  size?: number;
  uri?: string;
};

export function ProfileAvatarPicker({ initials, onChange, size = 108, uri }: ProfileAvatarPickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function choosePhoto(source: "camera" | "library") {
    setIsSaving(true);

    try {
      const ImagePicker = await import("expo-image-picker");
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          source === "camera" ? "Camera access needed" : "Photo access needed",
          `Allow BingeBook to use your ${source === "camera" ? "camera" : "photo library"} to set a profile picture.`
        );
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.82 })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              mediaTypes: ["images"],
              quality: 0.82,
            });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await persistAvatar(result.assets[0]);
        await onChange(savedUri);
        setIsPickerOpen(false);
      }
    } catch {
      Alert.alert("Photo unavailable", "BingeBook could not use that photo. Please try another one.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        accessibilityLabel="Change profile picture"
        accessibilityRole="button"
        activeOpacity={0.86}
        disabled={isSaving}
        onPress={() => setIsPickerOpen(true)}
        style={[styles.avatarButton, { borderRadius: size / 2, height: size, width: size }]}>
        {uri ? (
          <Image contentFit="cover" source={{ uri }} style={[styles.avatarImage, { borderRadius: size / 2 }]} />
        ) : (
          <View style={[styles.avatarFallback, { borderRadius: size / 2 }]}>
            <Text style={[styles.initials, { fontSize: Math.max(22, size * 0.28) }]}>{initials}</Text>
          </View>
        )}
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={16} color="#071323" />
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsPickerOpen(false)}
        statusBarTranslucent
        transparent
        visible={isPickerOpen}>
        <View style={styles.overlay}>
          <Pressable onPress={() => setIsPickerOpen(false)} style={StyleSheet.absoluteFillObject} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Profile picture</Text>
            <Text style={styles.sheetCopy}>Choose how you want to show up on BingeBook.</Text>

            <TouchableOpacity activeOpacity={0.84} onPress={() => void choosePhoto("camera")} style={styles.sourceButton}>
              <View style={styles.sourceIcon}>
                <Ionicons name="camera-outline" size={22} color="#071323" />
              </View>
              <View style={styles.sourceCopy}>
                <Text style={styles.sourceTitle}>Take a photo</Text>
                <Text style={styles.sourceDetail}>Open your camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(7,19,35,0.42)" />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.84} onPress={() => void choosePhoto("library")} style={styles.sourceButton}>
              <View style={styles.sourceIcon}>
                <Ionicons name="images-outline" size={22} color="#071323" />
              </View>
              <View style={styles.sourceCopy}>
                <Text style={styles.sourceTitle}>Choose from gallery</Text>
                <Text style={styles.sourceDetail}>Pick an existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(7,19,35,0.42)" />
            </TouchableOpacity>

            {uri ? (
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={() => {
                  void onChange("");
                  setIsPickerOpen(false);
                }}
                style={styles.removeButton}>
                <Ionicons name="trash-outline" size={18} color="#B83D50" />
                <Text style={styles.removeText}>Remove current photo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

async function persistAvatar(asset: ImagePickerAsset) {
  if (Platform.OS === "web") {
    return asset.uri;
  }

  const FileSystem = await import("expo-file-system/legacy");

  if (!FileSystem.documentDirectory) {
    return asset.uri;
  }

  const rawExtension = asset.fileName?.split(".").pop()?.toLowerCase() ?? "jpg";
  const extension = /^[a-z0-9]+$/.test(rawExtension) ? rawExtension : "jpg";
  const fileName = `bingebook-profile-avatar-${Date.now()}.${extension}`;
  const destination = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.copyAsync({ from: asset.uri, to: destination });

  const savedFiles = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
  await Promise.all(
    savedFiles
      .filter((savedFile) => savedFile.startsWith("bingebook-profile-avatar-") && savedFile !== fileName)
      .map((savedFile) =>
        FileSystem.deleteAsync(`${FileSystem.documentDirectory}${savedFile}`, { idempotent: true })
      )
  );

  return destination;
}

const styles = StyleSheet.create({
  avatarButton: {
    borderColor: "#F1D99D",
    borderWidth: 4,
    padding: 4,
    position: "relative",
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "#FFFAF0",
    flex: 1,
    justifyContent: "center",
  },
  initials: {
    color: "#071323",
    fontWeight: "900",
  },
  cameraBadge: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderColor: "#071323",
    borderRadius: 999,
    borderWidth: 2,
    bottom: -2,
    height: 32,
    justifyContent: "center",
    position: "absolute",
    right: -4,
    width: 32,
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.56)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFAF0",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "rgba(7,19,35,0.14)",
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 42,
  },
  sheetTitle: {
    color: "#071323",
    fontSize: 24,
    fontWeight: "900",
  },
  sheetCopy: {
    color: "rgba(7,19,35,0.58)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 18,
    marginTop: 4,
  },
  sourceButton: {
    alignItems: "center",
    borderColor: "rgba(7,19,35,0.09)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 70,
  },
  sourceIcon: {
    alignItems: "center",
    backgroundColor: "#F1D99D",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sourceCopy: {
    flex: 1,
  },
  sourceTitle: {
    color: "#071323",
    fontSize: 15,
    fontWeight: "900",
  },
  sourceDetail: {
    color: "rgba(7,19,35,0.52)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  removeButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
  },
  removeText: {
    color: "#B83D50",
    fontSize: 13,
    fontWeight: "900",
  },
});

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export default function CustomerPhotoScreen({ route }) {
  const { itemName, rentalDate } = route.params || {};
  const [cameraType, setCameraType] = useState('back');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const generateFileName = () => {
    const safeName = itemName?.toLowerCase().replace(/\s+/g, "_") || "item";
    const dateStr = rentalDate?.replace(/-/g, "") || new Date().toISOString().slice(0,10).replace(/-/g, "");
    return `rental_${safeName}_${dateStr}.jpg`;
  };

  const savePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Camera roll access is required.");
        return;
      }

      const albumName = "RentalPhotos";
      const asset = await MediaLibrary.createAssetAsync(photo.uri);

      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert("Success", "Photo saved to RentalPhotos album.");
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Failed to save photo.");
    } finally {
      setLoading(false);
    }
  };

  if (!permission) return <Text>Requesting camera permission...</Text>;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No camera access.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={styles.permission}>Tap to allow</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={cameraType}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      />
      <TouchableOpacity
        onPress={savePhoto}
        disabled={loading}
        style={styles.captureButton}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capture & Save</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    left: '25%',
    right: '25%',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  permission: { color: 'blue', marginTop: 10 },
});

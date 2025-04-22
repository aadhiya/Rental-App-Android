import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { doc, updateDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/services/firebaseConfig';

const RentalScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraType, setCameraType] = useState('back');
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleConfirmRental = async () => {
    if (!quantity || quantity <= 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Quantity must be greater than 0.' });
      return;
    }
    if (!customerName || !phoneNumber) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please enter customer name and phone number.' });
      return;
    }
    if (endDate < startDate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'End date must be after the start date.' });
      return;
    }

    try {
      const materialRef = doc(db, 'materials', item.id);
      const materialSnapshot = await getDoc(materialRef);

      if (materialSnapshot.exists()) {
        const currentStock = materialSnapshot.data().quantity;

        if (currentStock < quantity) {
          Toast.show({
            type: 'error',
            text1: 'Insufficient Stock',
            text2: `Only ${currentStock} items available.`,
          });
          return;
        }

        const updatedStock = currentStock - quantity;
        await updateDoc(materialRef, { quantity: updatedStock });

        await addDoc(collection(db, 'customers'), {
          name: customerName,
          mobileNumber: phoneNumber,
          itemName: item.name,
          quantity: parseInt(quantity),
          rate: item.rate,
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          createdAt: Timestamp.now(),
        });

        navigation.navigate('Generate Bill', {
          customerName,
          phoneNumber,
          itemName: item.name,
          quantity,
          rate: item.rate,
          startDate: startDate.toDateString(),
          endDate: endDate.toDateString(),
          amount: quantity * item.rate,
        });

        Toast.show({
          type: 'success',
          text1: 'Rental Confirmed',
          text2: `Item: ${item.name}, Quantity: ${quantity}, Remaining Stock: ${updatedStock}`,
        });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Item not found in stock.' });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update stock.' });
    }
  };

  const generateFileName = () => {
    const safeName = item?.name?.toLowerCase().replace(/\s+/g, '_') || 'item';
    const dateStr = startDate?.toISOString().slice(0, 10).replace(/-/g, '') || 'unknown';
    return `rental_${safeName}_${dateStr}.jpg`;
  };

  const savePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is required.');
        return;
      }

      const albumName = 'RentalPhotos';
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (!album) {
        album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Success', `Photo saved as ${generateFileName()} to RentalPhotos album.`);
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Failed to save photo.');
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No item selected for rental. Please go back and select an item.</Text>
      </View>
    );
  }

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.header}>Rent Item</Text>

          <Text style={styles.itemDetail}><Text style={styles.bold}>Item:</Text> {item.name}</Text>
          <Text style={styles.itemDetail}><Text style={styles.bold}>Rate per day:</Text> ₹{item.rate}</Text>

          <Text style={styles.label}>Quantity:</Text>
          <TextInput style={styles.input} placeholder="Enter Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />

          <Text style={styles.label}>Customer Name:</Text>
          <TextInput style={styles.input} placeholder="Enter Customer Name" value={customerName} onChangeText={setCustomerName} />

          <Text style={styles.label}>Phone Number:</Text>
          <TextInput style={styles.input} placeholder="Enter Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

          <Text style={styles.label}>Start Date:</Text>
          <Button title="Select Start Date" onPress={() => setShowStartPicker(true)} />
          {showStartPicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} minimumDate={new Date()} />}

          <Text style={styles.label}>End Date:</Text>
          <Button title="Select End Date" onPress={() => setShowEndPicker(true)} />
          {showEndPicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} minimumDate={startDate} />}

          <View style={styles.buttonContainer}>
            <Button title="Confirm Rental" onPress={handleConfirmRental} color="#2196F3" />
          </View>

          <View style={{ marginTop: 30 }}>
            <Button title="Capture Customer Photo" onPress={() => setShowCamera(!showCamera)} />
            {showCamera && (
              <>
                <CameraView
                  style={{ height: 300, marginTop: 10 }}
                  facing={cameraType}
                  ref={cameraRef}
                  onCameraReady={() => setIsCameraReady(true)}
                />
                <TouchableOpacity onPress={savePhoto} disabled={loading} style={styles.captureButton}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capture & Save Photo</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemDetail: { fontSize: 16, marginBottom: 10 },
  bold: { fontWeight: 'bold' },
  label: { fontSize: 16, marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 20 },
  buttonContainer: { marginTop: 20 },
  captureButton: { marginTop: 10, backgroundColor: '#6200ee', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 50 },
  permission: { color: 'blue', marginTop: 10 },
});

export default RentalScreen;


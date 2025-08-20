import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback,
  Keyboard, Platform, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { doc, updateDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/app/services/firebaseConfig';
import { savePhotoToRents } from '@/utils/photoUtils';

const RentalScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');
  const [loading, setLoading] = useState(false);

  const [captureMode, setCaptureMode] = useState(null);
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };
  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleSnapPhoto = async () => {
    if (!cameraRef.current || !isCameraReady || !captureMode) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll access is required.');
        setLoading(false);
        return;
      }
      const customer = customerName || 'customer';
      const { asset, localUri } = await savePhotoToRents(photo.uri, customer, captureMode);

      if (captureMode === 'aadhaar') setAadhaarPhoto(localUri);
      else if (captureMode === 'vehicle') setVehiclePhoto(localUri);

      Toast.show({
        type: 'success',
        text1: 'Photo Captured',
        text2: `${captureMode === 'aadhaar' ? 'Aadhaar' : 'Vehicle'} photo saved.`,
      });
      setCaptureMode(null);
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Failed to save photo.');
    } finally {
      setLoading(false);
    }
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
      setLoading(true);
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
          setLoading(false);
          return;
        }
        const updatedStock = currentStock - quantity;

        await updateDoc(materialRef, { quantity: updatedStock });
        // Create rental and get docRef (for docId)
        const docRef = await addDoc(collection(db, 'customers'), {
          name: customerName,
          mobileNumber: phoneNumber,
          itemName: item.name,
           itemId: item.id, // ✅ Firestore material doc ID
          quantity: parseInt(quantity),
          rate: item.rate,
          startDate: Timestamp.fromDate(startDate),
          endDate: Timestamp.fromDate(endDate),
          advancePaid: advancePaid ? Number(advancePaid) : 0,
          createdAt: Timestamp.now(),
          aadhaarPhoto: aadhaarPhoto || null,
          vehiclePhoto: vehiclePhoto || null,
          status: "pending",
        });
        setLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Rental Confirmed',
          text2: `Item: ${item.name}, Quantity: ${quantity}, Remaining Stock: ${updatedStock}`,
        });
        // Pass docId to Bill Generation screen!
        navigation.navigate('Generate Bill', {
          customerName,
          phoneNumber,
          itemName: item.name,
          quantity,
          rate: item.rate,
          startDate: startDate.toDateString(),
          endDate: endDate.toDateString(),
          createdAt: Timestamp.now(),
          advancePaid: advancePaid || '0',
          aadhaarPhoto,
          vehiclePhoto,
          docId: docRef.id, // <- this is the rent document ID
        });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Item not found in stock.' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update stock.' });
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <View style={styles.error}>
        <Text>No item selected for rental. Please go back and select an item.</Text>
      </View>
    );
  }

  if (captureMode && permission) {
    if (!permission.granted) {
      return (
        <View style={styles.permission}>
          <Text>No camera access.</Text>
          <Button title="Tap to allow" onPress={requestPermission} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1, justifyContent: 'flex-end' }}
          onCameraReady={() => setIsCameraReady(true)}
        />
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleSnapPhoto}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> :
            <Text style={styles.buttonText}>
              {captureMode === 'aadhaar' ? 'Capture Aadhaar' : 'Capture Vehicle'}
            </Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.captureButton, backgroundColor: 'gray', marginTop: 10 }}
          onPress={() => setCaptureMode(null)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
          <Text style={styles.header}>Rent Item</Text>
          <Text style={styles.itemDetail}><Text style={styles.bold}>Item:</Text> {item.name}</Text>
          <Text style={styles.itemDetail}><Text style={styles.bold}>Rate per day:</Text> ₹{item.rate}</Text>
          <Text style={styles.label}>Quantity:</Text>
          <TextInput
            style={styles.input}
            value={quantity.toString()}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Customer Name:</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
          />
          <Text style={styles.label}>Phone Number:</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={styles.label}>Advance Paid:</Text>
          <TextInput
            style={styles.input}
            value={advancePaid}
            onChangeText={setAdvancePaid}
            placeholder="Enter advance paid amount"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Start Date:</Text>
          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.input}>{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
          <Text style={styles.label}>End Date:</Text>
          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.input}>{endDate.toDateString()}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
          <Text style={styles.label}>Aadhaar Card Photo (optional):</Text>
          {aadhaarPhoto ? (
            <Image source={{ uri: aadhaarPhoto }} style={{ width: 100, height: 60, marginBottom: 10 }} />
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => setCaptureMode('aadhaar')}
            >
              <Text style={styles.buttonText}>Capture Aadhaar Card</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.label}>Customer Vehicle Photo (optional):</Text>
          {vehiclePhoto ? (
            <Image source={{ uri: vehiclePhoto }} style={{ width: 100, height: 60, marginBottom: 10 }} />
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => setCaptureMode('vehicle')}
            >
              <Text style={styles.buttonText}>Capture Vehicle</Text>
            </TouchableOpacity>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={{
                ...styles.captureButton,
                backgroundColor: loading ? 'gray' : '#6200ee',
                marginTop: 20,
              }}
              onPress={handleConfirmRental}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Rental</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
  style={{
    marginTop: 10,
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  }}
  onPress={() => navigation.navigate('Home')} // or navigation.goBack()
>
  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
</TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
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
  error: { flex: 1, justifyContent: 'center', alignItems: 'center', color: 'red', fontSize: 16 },
  permission: { color: 'blue', marginTop: 10 },
});

export default RentalScreen;

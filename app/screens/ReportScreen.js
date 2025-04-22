import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/app/services/firebaseConfig';
import * as MediaLibrary from 'expo-media-library';
import Toast from 'react-native-toast-message';

const ReportScreen = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [rents, setRents] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchRents();
    loadPhotos();
  }, [startDate]);

  const fetchRents = async () => {
    try {
      const rentsCollection = collection(db, 'customers');
      const q = query(
        rentsCollection,
        where('createdAt', '>=', Timestamp.fromDate(startDate))
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRents(data);
    } catch (error) {
      console.error('Error fetching rents:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch rental data.' });
    }
  };

  const loadPhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log("No permission for media library");
      return;
    }

    const album = await MediaLibrary.getAlbumAsync("RentalPhotos");
    if (album) {
      const { assets } = await MediaLibrary.getAssetsAsync({
        album: album.id,
        mediaType: 'photo',
        first: 100,
        sortBy: [['creationTime', false]],
      });
      setPhotos(assets);
    }
  };

  const generateExpectedFilename = (itemName, createdAt) => {
    const safeName = itemName?.toLowerCase().replace(/\s+/g, "").replace(/'/g, "");
    const date = createdAt?.toDate().toISOString().slice(0, 10).replace(/-/g, "");
    return `rental_${safeName}_${date}.jpg`;
  };

  const findPhotoUri = (expectedName) => {
    const match = photos.find((p) => p.filename === expectedName);
    return match?.uri;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const renderItem = ({ item }) => {
    const expectedFileName = generateExpectedFilename(item.itemName, item.createdAt);
    const imageUri = findPhotoUri(expectedFileName);

    return (
      <View style={styles.rentalBlock}>
        <Text style={styles.rentalText}>👤 {item.name}</Text>
        <Text style={styles.rentalText}>📦 {item.itemName} x {item.quantity}</Text>
        <Text style={styles.rentalText}>📅 {item.createdAt?.toDate().toLocaleDateString()}</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.noImage}>No Photo Found</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Rental Report</Text>

      <Text style={styles.label}>Start Date:</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text>{startDate.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}

      <Text style={styles.label}>Rental Data:</Text>
      {rents.length === 0 ? (
        <Text style={styles.noDataText}>No rental data available for the selected date.</Text>
      ) : (
        <FlatList
          data={rents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
      <Toast />
    </ScrollView>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  rentalBlock: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  rentalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  noImage: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 8,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  datePicker: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    marginBottom: 20,
    alignItems: 'center',
  },
});

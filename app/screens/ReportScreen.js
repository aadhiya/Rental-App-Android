import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Button } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './app/services/firebaseConfig.js';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as XLSX from 'xlsx';
import Toast from 'react-native-toast-message';

const ReportScreen = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [rents, setRents] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchRents();
  }, [startDate]);

  const fetchRents = async () => {
    try {
      const rentsCollection = collection(db, 'customers');
      const q = query(
        rentsCollection,
        where('createdAt', '>=', startDate.toISOString())
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

 
  
  const downloadExcel = async () => {
    try {
      // Prepare data for Excel
      const ws = XLSX.utils.json_to_sheet(rents);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rents');
  
      // Write Excel file to cache
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const cacheFilePath = `${FileSystem.cacheDirectory}rents_report.xlsx`;
  
      await FileSystem.writeAsStringAsync(cacheFilePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      console.log(`File created at cache: ${cacheFilePath}`);
  
      // Check for and request necessary permissions
      if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Permission to access media library is required.');
        }
      }
  
      // Move file to Downloads directory
      const downloadsDir = `${FileSystem.documentDirectory}Download/rents_report.xlsx`;
  
      await FileSystem.moveAsync({
        from: cacheFilePath,
        to: downloadsDir,
      });
  
      console.log(`File moved to Downloads: ${downloadsDir}`);
      Toast.show({
        type: 'success',
        text1: 'File Saved',
        text2: `Excel file saved to Downloads directory.`,
      });
  
    } catch (error) {
      console.error('Error generating Excel:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Could not save file: ${error.message}`,
      });
    }
  };
  
  


  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // Close the date picker
    if (selectedDate) {
      setStartDate(selectedDate); // Update the start date
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rental Report</Text>

      {/* Start Date Picker */}
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
          minimumDate={new Date(2000, 0, 1)} // Optional: Set a minimum date
        />
      )}

      {/* Rental Data Table */}
      <Text style={styles.label}>Rental Data:</Text>
      {rents.length === 0 ? (
        <Text style={styles.noDataText}>No rental data available for the selected date.</Text>
      ) : (
        <FlatList
          data={rents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text>{item.name}</Text>
              <Text>{item.itemName}</Text>
              <Text>{item.quantity}</Text>
              <Text>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}

      {/* Download as Excel Button */}
      <TouchableOpacity style={styles.downloadButton} onPress={downloadExcel}>
        <Text style={styles.buttonText}>Download as Excel</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  downloadButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  datePicker: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ccc',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

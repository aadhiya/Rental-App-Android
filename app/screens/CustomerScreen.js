import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { db } from './app/services/firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const CustomerScreen = ({ navigation, route }) => {
  const { itemName, quantity, rate, startDate, endDate } = route.params || {};
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const handleAddCustomer = async () => {
    if (!name || !idNumber || !mobileNumber || !vehicleNumber) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'All fields are required.',
      });
      return;
    }

    try {
      // Save customer and rental details to Firebase
      await addDoc(collection(db, 'customers'), {
        name,
        idNumber,
        mobileNumber,
        vehicleNumber,
        itemName,
        quantity,
        rate,
        startDate,
        endDate,
        createdAt: new Date().toISOString(),
      });

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Successfully rented ${itemName} for ${quantity} unit(s) at $${rate}/day.`,
      });

      // Clear input fields
      setName('');
      setIdNumber('');
      setMobileNumber('');
      setVehicleNumber('');

      // Navigate back to Home after successful addition
      setTimeout(() => {
        navigation.navigate('Home');
      }, 2000); // Adjust the delay as needed (e.g., 2 seconds)
    } catch (error) {
      console.error('Error adding customer and rental: ', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add customer and rental. Please try again.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Customer</Text>

      {/* Name Input */}
      <Text>Name:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Enter customer name"
        style={styles.input}
      />

      {/* ID Number Input */}
      <Text>ID Number:</Text>
      <TextInput
        value={idNumber}
        onChangeText={setIdNumber}
        placeholder="Enter ID number"
        style={styles.input}
      />

      {/* Mobile Number Input */}
      <Text>Mobile Number:</Text>
      <TextInput
        value={mobileNumber}
        onChangeText={setMobileNumber}
        keyboardType="numeric"
        placeholder="Enter mobile number"
        style={styles.input}
      />

      {/* Vehicle Number Input */}
      <Text>Vehicle Number:</Text>
      <TextInput
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        placeholder="Enter vehicle number"
        style={styles.input}
      />

      {/* Confirm Button */}
      <Button
        title="Add Customer and Confirm Rental"
        onPress={handleAddCustomer}
        color="#2196F3"
      />

      {/* Toast Message */}
      <Toast />
    </View>
  );
};

export default CustomerScreen;

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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
});

import React, { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

const RentalScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const handleConfirmRental = () => {
    if (!quantity || quantity <= 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Quantity must be greater than 0.' });
      return;
    }
    if (endDate < startDate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'End date must be after the start date.' });
      return;
    }

    navigation.navigate('Customer', {
      itemName: item.name,
      quantity,
      rate: item.rate,
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString(),
    });

    Toast.show({
      type: 'success',
      text1: 'Rental Confirmed',
      text2: `Item: ${item.name}, Quantity: ${quantity}, Rate: $${item.rate}/day`,
    });
  };

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No item selected for rental. Please go back and select an item.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Text style={styles.header}>Rent Item</Text>

          {/* Item Details */}
          <Text style={styles.itemDetail}>
            <Text style={styles.bold}>Item:</Text> {item.name}
          </Text>
          <Text style={styles.itemDetail}>
            <Text style={styles.bold}>Rate per day:</Text> ${item.rate}
          </Text>

          {/* Quantity Input */}
          <Text style={styles.label}>Quantity:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          {/* Start Date Picker */}
          <Text style={styles.label}>Start Date:</Text>
          <Button title="Select Start Date" onPress={() => setShowStartPicker(true)} />
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* End Date Picker */}
          <Text style={styles.label}>End Date:</Text>
          <Button title="Select End Date" onPress={() => setShowEndPicker(true)} />
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}

          {/* Confirm Rental Button */}
          <View style={styles.buttonContainer}>
            <Button title="Confirm Rental" onPress={handleConfirmRental} color="#2196F3" />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <Toast />
    </KeyboardAvoidingView>
  );
};

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
  itemDetail: {
    fontSize: 16,
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default RentalScreen;

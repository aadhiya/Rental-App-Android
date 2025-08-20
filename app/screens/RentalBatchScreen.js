import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const RentalBatchScreen = ({ route, navigation }) => {
  const { items } = route.params || [];

  // Initialize state with items including default rental details
  const [rentals, setRentals] = useState(
    items.map(item => ({
      ...item,
      quantity: '', // user input
      startDate: new Date(),
      endDate: new Date(),
      advancePaid: '', // user input
      showStartPicker: false,
      showEndPicker: false,
    }))
  );

  const updateRentalField = (index, field, value) => {
    const updated = [...rentals];
    updated[index][field] = value;
    setRentals(updated);
  };

  const onChangeStartDate = (index, event, selectedDate) => {
    setRentals(prev => {
      const updated = [...prev];
      updated[index].showStartPicker = false;
      if (selectedDate) updated[index].startDate = selectedDate;
      return updated;
    });
  };

  const onChangeEndDate = (index, event, selectedDate) => {
    setRentals(prev => {
      const updated = [...prev];
      updated[index].showEndPicker = false;
      if (selectedDate) updated[index].endDate = selectedDate;
      return updated;
    });
  };

  const validateAndProceed = () => {
    for (let rental of rentals) {
      if (!rental.quantity || Number(rental.quantity) <= 0) {
        Alert.alert('Validation Error', `Please enter a valid quantity for "${rental.name}".`);
        return;
      }
      if (rental.endDate < rental.startDate) {
        Alert.alert('Validation Error', `End date must be after start date for "${rental.name}".`);
        return;
      }
      if (rental.advancePaid && Number(rental.advancePaid) < 0) {
        Alert.alert('Validation Error', `Advance paid cannot be negative for "${rental.name}".`);
        return;
      }
    }

    // All validated; navigate to Bill Generation with combined rentals
    // Format rentals for bill screen as needed (e.g. dates as strings)
    const formattedRentals = rentals.map(r => ({
      ...r,
      startDate: r.startDate.toDateString(),
      endDate: r.endDate.toDateString(),
      quantity: Number(r.quantity),
      advancePaid: r.advancePaid ? Number(r.advancePaid) : 0,
    }));

    navigation.navigate('Generate Bill', { rentals: formattedRentals });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Rental Details for Selected Items</Text>

      {rentals.map((rental, index) => (
        <View key={rental.id} style={styles.itemContainer}>
          <Text style={styles.itemName}>{rental.name}</Text>

          <Text style={styles.label}>Quantity:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rental.quantity}
            onChangeText={text => updateRentalField(index, 'quantity', text)}
            placeholder="Enter quantity"
          />

          <Text style={styles.label}>Start Date:</Text>
          <TouchableOpacity
            onPress={() => updateRentalField(index, 'showStartPicker', true)}
            style={styles.datePickerButton}
          >
            <Text>{rental.startDate.toDateString()}</Text>
          </TouchableOpacity>
          {rental.showStartPicker && (
            <DateTimePicker
              value={rental.startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => onChangeStartDate(index, e, date)}
            />
          )}

          <Text style={styles.label}>End Date:</Text>
          <TouchableOpacity
            onPress={() => updateRentalField(index, 'showEndPicker', true)}
            style={styles.datePickerButton}
          >
            <Text>{rental.endDate.toDateString()}</Text>
          </TouchableOpacity>
          {rental.showEndPicker && (
            <DateTimePicker
              value={rental.endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => onChangeEndDate(index, e, date)}
            />
          )}

          <Text style={styles.label}>Advance Paid:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={rental.advancePaid}
            onChangeText={text => updateRentalField(index, 'advancePaid', text)}
            placeholder="Enter amount (optional)"
          />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button title="Generate Bill" onPress={validateAndProceed} />
      </View>
    </ScrollView>
  );
};

export default RentalBatchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
  },
  itemContainer: {
    marginVertical: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
  },
  datePickerButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
});

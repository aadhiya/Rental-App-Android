import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to Rental App</Text>

      {/* Button to navigate to Available Items Screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Available Items')}
        style={styles.button}
        activeOpacity={0.8}
        accessibilityLabel="View the list of available items for rent"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>View Available Items</Text>
      </TouchableOpacity>

      {/* Button to navigate to Rent Item Screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Report')}
        style={styles.button}
        activeOpacity={0.8}
        accessibilityLabel="View the rental report"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>View Report</Text>
      </TouchableOpacity>

      {/* Button to navigate to Stock Management Screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Stock Management')}
        style={[styles.button, styles.tertiaryButton]}
        activeOpacity={0.8}
        accessibilityLabel="Manage and view stock details"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Manage Stock</Text>
      </TouchableOpacity>

      {/* Button to navigate to Bill Generation Screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Generate Bill')}
        style={[styles.button, styles.secondaryButton]}
        activeOpacity={0.8}
        accessibilityLabel="Generate a bill and send to the customer"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Generate Bill</Text>
      </TouchableOpacity>

      {/* 🔥 New Button to Capture Customer Photo */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CustomerPhoto')}
        style={[styles.button, styles.captureButton]}
        activeOpacity={0.8}
        accessibilityLabel="Capture customer photo using camera"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Capture Customer Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#343A40',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFC107',
  },
  tertiaryButton: {
    backgroundColor: '#28A745',
  },
  captureButton: {
    backgroundColor: '#6F42C1', // Distinct purple for camera feature
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

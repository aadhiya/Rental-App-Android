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

      {/* Button to navigate to Upload Materials Screen */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Upload Materials')}
        style={[styles.button, styles.secondaryButton]}
        activeOpacity={0.8}
        accessibilityLabel="Upload new materials to the inventory"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Upload Materials</Text>
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
    justifyContent: 'center', // Center items vertically
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
    backgroundColor: '#28A745',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

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
} from 'react-native';
import { db } from './app/services/firebaseConfig.js';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const ManageMaterialsScreen = () => {
  const [materialName, setMaterialName] = useState('');
  const [materialRate, setMaterialRate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Add new material
  const addMaterial = async () => {
    if (!materialName || !materialRate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Both material name and rate are required.' });
      return;
    }

    try {
      const materialsCollection = collection(db, 'materials');
      await addDoc(materialsCollection, { name: materialName, rate: parseFloat(materialRate) });
      Toast.show({ type: 'success', text1: 'Success', text2: `Material "${materialName}" added successfully!` });
      setMaterialName('');
      setMaterialRate('');
    } catch (error) {
      console.error('Error adding material:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to add material. ${error.message}` });
    }
  };

  // Update material rate
  const updateMaterialRate = async () => {
    if (!materialName || !materialRate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Both material name and rate are required.' });
      return;
    }

    try {
      const materialsCollection = collection(db, 'materials');
      const q = query(materialsCollection, where('name', '==', materialName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Toast.show({ type: 'error', text1: 'Error', text2: `Material "${materialName}" does not exist.` });
        return;
      }

      // Update the material rate
      const materialDoc = querySnapshot.docs[0];
      const materialRef = doc(db, 'materials', materialDoc.id);
      await updateDoc(materialRef, { rate: parseFloat(materialRate) });

      Toast.show({ type: 'success', text1: 'Success', text2: `Rate for "${materialName}" updated successfully!` });
      setMaterialName('');
      setMaterialRate('');
    } catch (error) {
      console.error('Error updating material rate:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to update material rate. ${error.message}` });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View>
          <Text style={styles.header}>Manage Materials</Text>

          {/* Material Name Input */}
          <TextInput
            style={styles.input}
            placeholder="Material Name"
            value={materialName}
            onChangeText={setMaterialName}
          />

          {/* Material Rate Input */}
          <TextInput
            style={styles.input}
            placeholder="Material Rate"
            value={materialRate}
            onChangeText={setMaterialRate}
            keyboardType="numeric"
          />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title={isUpdating ? 'Update Rate' : 'Add Material'}
              onPress={isUpdating ? updateMaterialRate : addMaterial}
              color={isUpdating ? '#f39c12' : '#27ae60'}
            />
          </View>

          {/* Toggle Between Add and Update */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isUpdating ? 'Switch to Add Mode' : 'Switch to Update Mode'}
            </Text>
            <Button
              title={isUpdating ? 'Add Mode' : 'Update Mode'}
              onPress={() => setIsUpdating(!isUpdating)}
              color="#3498db"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default ManageMaterialsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  toggleContainer: {
    alignItems: 'center',
  },
  toggleText: {
    marginBottom: 10,
    fontSize: 16,
  },
});

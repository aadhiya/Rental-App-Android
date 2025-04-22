import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { db } from '@/app/services/firebaseConfig.js';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const ManageMaterialsScreen = () => {
  const [materials, setMaterials] = useState([]);
  const [materialName, setMaterialName] = useState('');
  const [materialRate, setMaterialRate] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  const [quantity, setQuantity] = useState('');

  // Fetch materials from Firestore
  const fetchMaterials = async () => {
    try {
      const materialsCollection = collection(db, 'materials');
      const querySnapshot = await getDocs(materialsCollection);
      const materialsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Add new material
  const addMaterial = async () => {
    if (!materialName || !materialRate) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Both material name and rate are required.' });
      return;
    }

    try {
      const materialsCollection = collection(db, 'materials');
      await addDoc(materialsCollection, { name: materialName, rate: parseFloat(materialRate), quantity: 0 });
      Toast.show({ type: 'success', text1: 'Success', text2: `Material "${materialName}" added successfully!` });
      setMaterialName('');
      setMaterialRate('');
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error('Error adding material:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to add material. ${error.message}` });
    }
  };

  // Update material quantity
  const updateMaterialQuantity = async (materialId) => {
    if (!quantity) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Quantity is required.' });
      return;
    }

    try {
      const materialRef = doc(db, 'materials', materialId);
      await updateDoc(materialRef, { quantity: parseInt(quantity, 10) });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Quantity updated successfully!' });
      setSelectedMaterialId(null);
      setQuantity('');
      fetchMaterials(); // Refresh the list
    } catch (error) {
      console.error('Error updating quantity:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to update quantity. ${error.message}` });
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

          {/* Add Material Button */}
          <Button title="Add Material" onPress={addMaterial} color="#27ae60" />

          <Text style={styles.sectionHeader}>Materials List</Text>

          {/* Materials List */}
          <FlatList
            data={materials}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.materialItem}>
                <TouchableOpacity onPress={() => setSelectedMaterialId(item.id)}>
                  <Text style={styles.materialName}>{item.name}</Text>
                  <Text>Rate: ${item.rate}</Text>
                  <Text>Quantity: {item.quantity || 0}</Text>
                </TouchableOpacity>

                {/* Show Input and Update Button for Selected Material */}
                {selectedMaterialId === item.id && (
                  <View style={styles.updateContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter Quantity"
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                    />
                    <Button
                      title="Update Quantity"
                      onPress={() => updateMaterialQuantity(item.id)}
                      color="#f39c12"
                    />
                  </View>
                )}
              </View>
            )}
          />
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  materialItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateContainer: {
    marginTop: 10,
  },
});

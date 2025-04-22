import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import Toast from 'react-native-toast-message';

const StockManagementScreen = () => {
  const [materials, setMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({ name: '', rate: '', quantity: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const materialsCollection = collection(db, 'materials');
      const snapshot = await getDocs(materialsCollection);
      const materialsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch materials.' });
    }
  };

  const addMaterial = async () => {
    if (!newMaterial.name || !newMaterial.rate || !newMaterial.quantity) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const materialDoc = {
        name: newMaterial.name,
        rate: parseFloat(newMaterial.rate),
        quantity: parseInt(newMaterial.quantity, 10),
      };
      await addDoc(collection(db, 'materials'), materialDoc);
      setNewMaterial({ name: '', rate: '', quantity: '' });
      setShowAddForm(false);
      fetchMaterials();
      Toast.show({ type: 'success', text1: 'Success', text2: 'Material added successfully.' });
    } catch (error) {
      console.error('Error adding material:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add material.' });
    }
  };

  const updateMaterial = async (id, updatedFields) => {
    try {
      const materialRef = doc(db, 'materials', id);
      await updateDoc(materialRef, updatedFields);
      fetchMaterials();
      Toast.show({ type: 'success', text1: 'Success', text2: 'Material updated successfully.' });
    } catch (error) {
      console.error('Error updating material:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update material.' });
    }
  };

  const handleUpdate = () => {
    if (!selectedMaterial || !selectedMaterial.rate || !selectedMaterial.quantity) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    updateMaterial(selectedMaterial.id, {
      rate: parseFloat(selectedMaterial.rate),
      quantity: parseInt(selectedMaterial.quantity, 10),
    });
    setShowEditModal(false);
    setSelectedMaterial(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stock Management</Text>

      {/* Add New Material Button */}
      {!showAddForm && (
        <Button title="Add New Item" onPress={() => setShowAddForm(true)} />
      )}

      {/* Add Material Form */}
      {showAddForm && (
        <View>
          <Text style={styles.label}>Add New Material</Text>
          <TextInput
            style={styles.input}
            placeholder="Material Name"
            value={newMaterial.name}
            onChangeText={(text) => setNewMaterial({ ...newMaterial, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Rate"
            keyboardType="numeric"
            value={newMaterial.rate}
            onChangeText={(text) => setNewMaterial({ ...newMaterial, rate: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            keyboardType="numeric"
            value={newMaterial.quantity}
            onChangeText={(text) => setNewMaterial({ ...newMaterial, quantity: text })}
          />
          <Button title="Add Material" onPress={addMaterial} />
        </View>
      )}

      {/* Existing Materials List */}
      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.materialName}>{item.name}</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Rate: ${item.rate}</Text>
              <Text style={styles.infoText}>Quantity: {item.quantity}</Text>
            </View>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => {
                setSelectedMaterial(item);
                setShowEditModal(true);
              }}
            >
              <Text style={styles.updateButtonText}>Update Stock</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Update Material Modal */}
      {showEditModal && (
        <Modal
          animationType="slide"
          transparent={false} // Solid white background
          visible={showEditModal}
          onRequestClose={() => {
            setShowEditModal(false);
            setSelectedMaterial(null);
          }}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalHeader}>Update {selectedMaterial?.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Rate"
              keyboardType="numeric"
              value={selectedMaterial?.rate?.toString()}
              onChangeText={(text) =>
                setSelectedMaterial({ ...selectedMaterial, rate: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={selectedMaterial?.quantity?.toString()}
              onChangeText={(text) =>
                setSelectedMaterial({ ...selectedMaterial, quantity: text })
              }
            />
            <View style={styles.modalButtons}>
              <Button title="Update" onPress={handleUpdate} />
              <Button
                title="Cancel"
                color="red"
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedMaterial(null);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
      <Toast />
    </View>
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
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Solid white background
    padding: 20,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
});

export default StockManagementScreen;

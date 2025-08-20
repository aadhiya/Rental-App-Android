import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, Platform
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import { db } from '@/app/services/firebaseConfig';
import {
  collection, query, where, onSnapshot, orderBy, Timestamp,updateDoc,doc,runTransaction, serverTimestamp,deleteDoc
} from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
};
const handleDelete = async (id) => {
  try {
    await deleteDoc(doc(db, 'customers', id));
    Alert.alert('Deleted', 'Rent entry permanently deleted.');
  } catch (error) {
    console.error('Delete error:', error);
    Alert.alert('Error', 'Could not delete rent.');
  }
};
const confirmDelete = (id) => {
  Alert.alert(
    'Delete Rent Entry',
    'Are you sure you want to permanently delete this rent?',
    [
      { text: 'No', style: 'cancel' }, // 👈 Cancel option
      { text: 'Yes', style: 'destructive', onPress: () => handleDelete(id) }, // 👈 Calls delete if confirmed
    ]
  );
};

const RentsScreen = () => {
  const [rents, setRents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(STATUS.PENDING);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    const rentsRef = collection(db, 'customers');

    let rentsQuery = null;

    if (filterStatus !== 'all' && selectedDate) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      rentsQuery = query(
        rentsRef,
        where('status', '==', filterStatus),
        where('endDate', '>=', Timestamp.fromDate(start)),
        where('endDate', '<', Timestamp.fromDate(end)),
        orderBy('createdAt', 'desc')
      );
    } else if (filterStatus !== 'all') {
      rentsQuery = query(
        rentsRef,
        where('status', '==', filterStatus),
        orderBy('createdAt', 'desc')
      );
    } else {
      rentsQuery = query(rentsRef, orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(
      rentsQuery,
      (snapshot) => {
        const rentList = [];
        snapshot.forEach((docSnap) => {
          rentList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRents(rentList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching rents:', error);
        Alert.alert('Error', 'Failed to load rents.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterStatus, selectedDate]);

  const confirmMarkPaid = (rent) => {
    Alert.alert(
      'Mark as Paid',
      `Are you sure you want to mark the rent for "${rent.itemName}" by ${rent.name} as PAID?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => markAsPaid(rent) },
      ]
    );
  };
const markAsPaid = async (rent) => {
  if (!rent.itemId) {
    console.error("Missing itemId in rent: cannot update stock");
    return;
  }

  const rentDocRef = doc(db, 'customers', rent.id);
  const materialRef = doc(db, 'materials', rent.itemId);

  try {
    await runTransaction(db, async (transaction) => {
      const materialSnap = await transaction.get(materialRef);
      if (!materialSnap.exists()) {
        throw new Error("Material document does not exist");
      }

      const currentStock = materialSnap.data().quantity || 0;
      console.log(`Current stock for item ${rent.itemId}: ${currentStock}`);

      const updatedStock = currentStock + rent.quantity;
      console.log(`Updating stock for item ${rent.itemId} to ${updatedStock}`);

      transaction.update(materialRef, { quantity: updatedStock });

      transaction.update(rentDocRef, {
        status: "paid",
        paidAt: new Date()
      });
    });

    console.log("Transaction committed successfully");
  } catch (e) {
    console.error("Transaction failed: ", e);
  }
};
  

  const renderRentItem = ({ item }) => {
    const isPending = item.status === STATUS.PENDING;
    const amountToShow =
      item.finalAmount !== undefined && item.finalAmount !== null
        ? item.finalAmount
        : item.totalAmount !== undefined && item.totalAmount !== null
        ? item.totalAmount
        : 0;
const createdDate = item.createdAt?.toDate 
  ? item.createdAt.toDate().toLocaleString()
  : item.createdAt || 'N/A';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => isPending && confirmMarkPaid(item)}
        activeOpacity={isPending ? 0.7 : 1}
      >
         
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{item.name || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{item.mobileNumber || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Item:</Text>
          <Text style={styles.value}>{item.itemName || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{item.quantity || 0}</Text>
        </View>
        {/* Show Created Time */}
    <View style={styles.row}>
      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>
        {item.createdAt?.toDate 
          ? item.createdAt.toDate().toLocaleString()
          : item.createdAt || 'N/A'}
      </Text>
    </View>
        <View style={styles.row}>
          <Text style={styles.label}>Period:</Text>
          <Text style={styles.value}>
            {item.startDate?.toDate
              ? item.startDate.toDate().toLocaleDateString()
              : item.startDate || 'N/A'}
            {' - '}
            {item.endDate?.toDate
              ? item.endDate.toDate().toLocaleDateString()
              : item.endDate || 'N/A'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.value}>₹{Number(amountToShow).toFixed(2)}</Text>
        </View>
        {item.status === STATUS.PAID && item.paidAt && (
          <View style={styles.row}>
            <Text style={styles.label}>Paid On:</Text>
            <Text style={styles.value}>
              {item.paidAt.toDate ? item.paidAt.toDate().toLocaleDateString() : ''}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLOR[item.status] || '#999' },
          ]}
        >
          <Text style={styles.statusText}>{item.status?.toUpperCase() || 'N/A'}</Text>
         

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterRow}>
        {['all', STATUS.PENDING, STATUS.PAID].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.filterText}>
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString()
              : 'Select Date'}
          </Text>
        </TouchableOpacity>
        {selectedDate && (
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: '#f44336' }]}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={styles.filterTextActive}>Clear Date</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios'); // keep picker open on iOS
            if (date) setSelectedDate(date.toISOString());
          }}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text>Loading rents...</Text>
        </View>
      ) : rents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text>No rents found for "{filterStatus}" status.</Text>
        </View>
      ) : (
        <FlatList
          data={rents}
          keyExtractor={(item) => item.id}
          renderItem={renderRentItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const STATUS_COLOR = {
  pending: '#FF4444',
  paid: '#4CAF50',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  filterButtonActive: {
    backgroundColor: '#6200ee',
  },
  filterText: {
    fontSize: 16,
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    flex: 1,
    color: '#333',
  },
  value: {
    flex: 1.3,
    fontWeight: '500',
    color: '#555',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RentsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/app/services/firebaseConfig'; // Update import path as per your project

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const ReportScreen = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1); // default start date: one month ago
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999); // default end date: today end of day
    return d;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [rents, setRents] = useState([]);

  // Fetch rents between startDate and endDate
  const fetchRentsInRange = async () => {
    try {
      const rentsCollection = collection(db, 'customers');

      const q = query(
        rentsCollection,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRents(data);
    } catch (error) {
      console.error('Error fetching rents:', error);
      Alert.alert('Error', 'Failed to fetch rental records.');
      setRents([]);
    }
  };

  // Fetch rents whenever the date range changes
  useEffect(() => {
    fetchRentsInRange();
  }, [startDate, endDate]);

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate > endDate) {
        Alert.alert('Invalid Date', 'Start date cannot be after end date.');
        return;
      }
      setStartDate(new Date(selectedDate));
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      selectedDate.setHours(23, 59, 59, 999);
      if (selectedDate < startDate) {
        Alert.alert('Invalid Date', 'End date cannot be before start date.');
        return;
      }
      setEndDate(new Date(selectedDate));
    }
  };

  // Create HTML for the PDF rental report including total amount row
  const generateReportHTML = (rents, startDate, endDate) => {
    // Calculate total amount for all rents
    const totalAmount = rents.reduce((sum, r) => {
      const quantity = r.quantity || 1;
      const rate = r.rate || 0;
      return sum + quantity * rate;
    }, 0);

    let rows = rents.map((r, idx) => {
      const dateObj = r.createdAt?.toDate?.() || new Date(0);
      const dateStr = dateObj.toLocaleDateString();
      const itemName = r.itemName || 'N/A';
      const quantity = r.quantity || 1;
      const rate = r.rate || 0;
      const amount = quantity * rate;
      const customerName = r.name || 'N/A';

      return `
        <tr>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:6px;">${customerName}</td>
          <td style="border:1px solid #000; padding:6px;">${itemName}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${quantity}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">₹${rate.toFixed(2)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">₹${amount.toFixed(2)}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${dateStr}</td>
        </tr>
      `;
    }).join('');

    if (rents.length === 0) {
      rows = `<tr><td colspan="7" style="text-align:center; padding:10px;">No rental records found in this period.</td></tr>`;
    } else {
      // Append a total row at the end
      rows += `
        <tr style="font-weight:bold; background-color:#f2f2f2;">
          <td colspan="5" style="border:1px solid #000; padding:6px; text-align:right;">Total Amount</td>
          <td style="border:1px solid #000; padding:6px; text-align:right;">₹${totalAmount.toFixed(2)}</td>
          <td style="border:1px solid #000; padding:6px;"></td>
        </tr>
      `;
    }

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px;}
            th, td { border: 1px solid #000; padding: 6px;}
            th {background-color: #f2f2f2;}
            caption { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>Rental Report</h1>
          <p style="text-align:center;">From <strong>${startDate.toDateString()}</strong> to <strong>${endDate.toDateString()}</strong></p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  // Generate and share PDF of rentals
  const shareReportAsPDF = async () => {
    if (rents.length === 0) {
      Alert.alert('No Data', 'No rental records available to share.');
      return;
    }
    try {
      const html = generateReportHTML(rents, startDate, endDate);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Rental Report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share rental report.');
    }
  };

  // Render each rent item in the list
  const renderItem = ({ item }) => {
    const dateStr = item.createdAt?.toDate?.().toLocaleDateString() || 'N/A';
    const itemName = item.itemName || 'N/A';
    const quantity = item.quantity || 1;
    const rate = item.rate || 0;
    const amount = quantity * rate;

    return (
      <View style={styles.rentItem}>
        <Text style={styles.rentText}>Customer: {item.name || 'N/A'}</Text>
        <Text style={styles.rentText}>Item: {itemName} × {quantity} @ ₹{rate.toFixed(2)}</Text>
        <Text style={styles.rentText}>Date: {dateStr}</Text>
        <Text style={styles.rentText}>Amount: ₹{amount.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rental Report</Text>

      <View style={styles.datePickerContainer}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
          <Text>Select Start Date: {startDate.toDateString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
          <Text>Select End Date: {endDate.toDateString()}</Text>
        </TouchableOpacity>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}

      <Text style={styles.subTitle}>
        Rents from {startDate.toDateString()} to {endDate.toDateString()}:
      </Text>

      {rents.length === 0 ? (
        <Text style={styles.noDataText}>No rents found in this period.</Text>
      ) : (
        <FlatList
          data={rents}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}

      <TouchableOpacity style={styles.shareButton} onPress={shareReportAsPDF}>
        <Text style={styles.shareButtonText}>Share Report as PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  subTitle: {
    fontSize: 18,
    marginVertical: 10,
    textAlign: 'center',
  },
  rentItem: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  rentText: {
    fontSize: 16,
    marginVertical: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
  shareButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 15,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReportScreen;

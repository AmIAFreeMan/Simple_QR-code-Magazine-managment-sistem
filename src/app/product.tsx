import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Product {
  id: string;
  name: string;
  qty: number;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      fetchProductDetails(id);
    }
  }, [id]);

  const fetchProductDetails = async (productId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${productId}`, {
        headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
      });
      setProduct(response.data);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Product not found on backend.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProductQuantity = async (delta: number) => {
    if (!product) return;
    const updatedQty = Math.max(0, product.qty + delta);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await axios.patch(`${API_BASE_URL}/${product.id}`, { qty: updatedQty }, {
        headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
      });
      setProduct((prev) => (prev ? { ...prev, qty: updatedQty } : null));
    } catch (error: any) {
      Alert.alert("Update Failed", error.response?.data?.message || error.message);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    Alert.alert("Confirm Delete", `Delete product ${product.id}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/${product.id}`, {
              headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } catch (error: any) {
            Alert.alert("Delete Failed", error.response?.data?.message || error.message);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back to Scanner</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 50 }} />
      ) : product ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.cardSubtitle}>Product ID: {product.id}</Text>
          
          <View style={styles.qtyContainer}>
            <Text style={styles.label}>Stock Quantity:</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity style={styles.stepButton} onPress={() => updateProductQuantity(-1)}>
                <Text style={styles.stepText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{product.qty}</Text>
              <TouchableOpacity style={styles.stepButton} onPress={() => updateProductQuantity(1)}>
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteProduct}>
            <Text style={styles.deleteButtonText}>Delete Product from Database</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>Product not found on backend.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6', padding: 20, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  card: { padding: 20, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  qtyContainer: { marginVertical: 15 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stepButton: { backgroundColor: '#007AFF', width: 50, height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  qtyValue: { fontSize: 26, fontWeight: 'bold', marginHorizontal: 30 },
  deleteButton: { marginTop: 30, backgroundColor: '#FF3B30', padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  errorText: { textAlign: 'center', fontSize: 16, color: '#ff3b30', marginTop: 40 }
});
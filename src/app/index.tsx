import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL_TEST;

interface Product {
  id: string;
  name: string;
  qty: number;
}

export default function IndexScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<'scan' | 'crud'>('scan');
  const [manualId, setManualId] = useState<string>('');

  // CRUD state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [newId, setNewId] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newQty, setNewQty] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'crud') {
      fetchProducts();
    }
  }, [activeTab]);

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>We need camera access to scan codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({ pathname: '/product' as any, params: { id: data } });
  };

  const handleManualSubmit = () => {
    if (!manualId.trim()) return;
    router.push({ pathname: '/product' as any, params: { id: manualId.trim() } });
  };

  // Real API CRUD functions (No Mock Data)
  const fetchProducts = async () => {
    setLoadingList(true);
    try {
      const response = await axios.get(API_BASE_URL!, {
        headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
      });
      setProducts(response.data);
    } catch (error: any) {
      Alert.alert("API Error", error.response?.data?.message || error.message || "Failed to fetch products.");
      setProducts([]);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newId.trim() || !newName.trim() || !newQty.trim()) {
      Alert.alert("Validation Error", "Please fill in all product fields.");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(API_BASE_URL!, {
        id: newId.trim(),
        name: newName.trim(),
        qty: parseInt(newQty, 10) || 0
      }, {
        headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Product created successfully!");
      setNewId('');
      setNewName('');
      setNewQty('');
      fetchProducts();
    } catch (error: any) {
      Alert.alert("Create Failed", error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQty = async (id: string, currentQty: number, delta: number) => {
    const updatedQty = Math.max(0, currentQty + delta);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await axios.patch(`${API_BASE_URL}/${id}`, { qty: updatedQty }, {
        headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
      });
      fetchProducts();
    } catch (error: any) {
      Alert.alert("Update Failed", error.response?.data?.message || error.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert("Confirm Delete", `Delete product ${id}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE_URL}/${id}`, {
              headers: { 'Authorization': 'Bearer YOUR_STAFF_AUTH_TOKEN' }
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            fetchProducts();
          } catch (error: any) {
            Alert.alert("Delete Failed", error.response?.data?.message || error.message);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'scan' && styles.activeTab]} 
          onPress={() => setActiveTab('scan')}
        >
          <Text style={styles.tabText}>Scanner & Search</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'crud' && styles.activeTab]} 
          onPress={() => setActiveTab('crud')}
        >
          <Text style={styles.tabText}>Inventory CRUD</Text>
        </TouchableOpacity>
      </View>

      {/* SCANNING TAB */}
      {activeTab === 'scan' && (
        <View style={styles.contentContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "code128"],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanTarget} />
              <Text style={styles.scanInstructions}>Align barcode inside the frame</Text>
            </View>
          </View>

          <View style={styles.fallbackBox}>
            <Text style={styles.label}>Search Product ID directly:</Text>
            <View style={styles.row}>
              <TextInput
                style={styles.smallInput}
                value={manualId}
                onChangeText={setManualId}
                placeholder="e.g. PROD-123"
              />
              <TouchableOpacity style={styles.goToButton} onPress={handleManualSubmit}>
                <Text style={styles.buttonText}>Open Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* CRUD TAB */}
      {activeTab === 'crud' && (
        <View style={styles.crudContainer}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Add New Product</Text>
            <TextInput
              style={styles.input}
              placeholder="Product ID / SKU"
              value={newId}
              onChangeText={setNewId}
            />
            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Initial Quantity"
              keyboardType="numeric"
              value={newQty}
              onChangeText={setNewQty}
            />
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateProduct}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Product</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Backend Inventory ({products.length})</Text>
          {loadingList ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productId}>ID: {item.id}</Text>
                    <Text style={styles.productQty}>Qty: {item.qty}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.qty, -1)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQty(item.id, item.qty, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id)}>
                      <Text style={styles.deleteBtnText}>Del</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f6', paddingTop: 50 },
  permissionText: { textAlign: 'center', marginBottom: 20, fontSize: 16, paddingHorizontal: 20 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignSelf: 'center', paddingHorizontal: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderColor: '#007AFF' },
  tabText: { fontWeight: '600', fontSize: 15 },
  contentContainer: { flex: 1 },
  cameraWrapper: { flex: 3, position: 'relative', overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 220, height: 220, borderWidth: 2, borderColor: '#00FF00', backgroundColor: 'transparent', borderRadius: 12 },
  scanInstructions: { color: '#fff', marginTop: 20, fontSize: 14, fontWeight: '500' },
  fallbackBox: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#333' },
  row: { flexDirection: 'row', gap: 10 },
  smallInput: { flex: 1, height: 45, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  goToButton: { backgroundColor: '#007AFF', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  crudContainer: { flex: 1, padding: 15 },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: { height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, marginBottom: 10, backgroundColor: '#fafafa' },
  createButton: { backgroundColor: '#34C759', padding: 12, borderRadius: 6, alignItems: 'center' },
  productCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  productId: { fontSize: 12, color: '#666' },
  productQty: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: { backgroundColor: '#007AFF', width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 10, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});
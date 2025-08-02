import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download, Upload, Camera, Share, Eye, Trash2, Plus, Import as Passport, CreditCard, Plane, Shield, MapPin, Calendar, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Info, Loader } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface Document {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'ticket' | 'insurance' | 'vaccination' | 'other';
  dateAdded: string;
  expiryDate?: string;
  size: string;
  status: 'valid' | 'expiring' | 'expired';
  uri?: string;
  mimeType?: string;
}

const sampleDocuments: Document[] = [
  {
    id: '1',
    name: 'UK Passport',
    type: 'passport',
    dateAdded: '2024-01-10',
    expiryDate: '2029-03-15',
    size: '2.1 MB',
    status: 'valid',
  },
  {
    id: '2',
    name: 'Flight Ticket - LHR to BCN',
    type: 'ticket',
    dateAdded: '2024-01-12',
    expiryDate: '2024-02-15',
    size: '1.3 MB',
    status: 'valid',
  },
  {
    id: '3',
    name: 'Travel Insurance',
    type: 'insurance',
    dateAdded: '2024-01-08',
    expiryDate: '2024-12-31',
    size: '890 KB',
    status: 'valid',
  },
  {
    id: '4',
    name: 'COVID-19 Vaccination',
    type: 'vaccination',
    dateAdded: '2023-06-20',
    expiryDate: '2024-06-20',
    size: '1.1 MB',
    status: 'expiring',
  },
];

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: FileText },
    { id: 'passport', label: 'Passport', icon: Passport },
    { id: 'visa', label: 'Visa', icon: CreditCard },
    { id: 'ticket', label: 'Tickets', icon: Plane },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'vaccination', label: 'Health', icon: Plus },
  ];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'passport':
        return <Passport size={20} color="#3b82f6" />;
      case 'visa':
        return <CreditCard size={20} color="#10b981" />;
      case 'ticket':
        return <Plane size={20} color="#f59e0b" />;
      case 'insurance':
        return <Shield size={20} color="#8b5cf6" />;
      case 'vaccination':
        return <Plus size={20} color="#ec4899" />;
      default:
        return <FileText size={20} color="#64748b" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return '#10b981';
      case 'expiring':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle size={16} color="#10b981" />;
      case 'expiring':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'expired':
        return <AlertTriangle size={16} color="#ef4444" />;
      default:
        return <Info size={16} color="#64748b" />;
    }
  };

  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => doc.type === selectedCategory);

  const addDocument = () => {
    console.log('🔘 Add Document button pressed');
    
    if (Platform.OS === 'web') {
      // Use web-native file input for better compatibility
      handleWebFileUpload();
    } else {
      // Use Expo APIs for mobile
      showMobileUploadOptions();
    }
  };

  const handleWebFileUpload = () => {
    console.log('🌐 Starting web file upload...');
    
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.pdf,.doc,.docx,.txt';
    input.multiple = false;
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        console.log('📁 File selected:', file.name, file.size, file.type);
        await processWebFile(file);
      }
    };
    
    // Trigger file picker
    input.click();
  };

  const processWebFile = async (file: File) => {
    console.log('📄 Processing web file:', file.name);
    setUploading(true);
    
    try {
      // Create a data URL for the file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        console.log('📄 File read successfully, size:', file.size);
        
        // Determine document type
        let documentType = 'other';
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('passport')) documentType = 'passport';
        else if (nameLower.includes('visa')) documentType = 'visa';
        else if (nameLower.includes('ticket') || nameLower.includes('flight')) documentType = 'ticket';
        else if (nameLower.includes('insurance')) documentType = 'insurance';
        else if (nameLower.includes('vaccination') || nameLower.includes('vaccine')) documentType = 'vaccination';
        
        const newDocument: Document = {
          id: Date.now().toString(),
          name: file.name,
          type: documentType as any,
          dateAdded: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          status: 'valid',
          uri: dataUrl,
          mimeType: file.type,
        };
        
        console.log('📄 New document created:', newDocument.name, newDocument.type);
        
        setDocuments(prev => [newDocument, ...prev]);
        
        Alert.alert(
          'Document Added Successfully! 🎉',
          `${file.name} has been added to your travel documents.`,
          [
            {
              text: 'View Document',
              onPress: () => viewDocument(newDocument),
            },
            { text: 'OK' },
          ]
        );
      };
      
      reader.onerror = () => {
        console.error('❌ Error reading file');
        Alert.alert('Error', 'Failed to read the selected file.');
      };
      
      // Read the file
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsDataURL(file); // For PDFs and other files
      }
      
    } catch (error) {
      console.error('❌ Error processing web file:', error);
      Alert.alert('Error', 'Failed to process the selected file.');
    } finally {
      setUploading(false);
    }
  };

  const showMobileUploadOptions = () => {
    Alert.alert(
      'Add Document',
      'Choose how to add your document:',
      [
        { 
          text: 'Take Photo', 
          onPress: takePhoto
        },
        { 
          text: 'Upload File', 
          onPress: pickDocument
        },
        { 
          text: 'Scan Document', 
          onPress: scanDocument
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    console.log('📷 Starting photo capture...');
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      setUploading(true);
      console.log('📷 Launching camera...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📷 Camera result:', result);
      
      if (!result.canceled && result.assets[0]) {
        console.log('📷 Photo taken, processing...');
        await processDocument(result.assets[0]);
      } else {
        console.log('📷 Photo capture cancelled');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    console.log('📁 Starting document picker...');
    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('📁 Document picker result:', result);
      
      if (!result.canceled && result.assets[0]) {
        console.log('📁 Document selected, processing...');
        await processDocument(result.assets[0]);
      } else {
        console.log('📁 Document selection cancelled');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const scanDocument = async () => {
    console.log('🔍 Starting document scan...');
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔍 Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to scan documents.');
        return;
      }

      setUploading(true);
      console.log('🔍 Launching camera for scanning...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect for documents
        quality: 1.0, // High quality for document scanning
      });

      console.log('🔍 Scan result:', result);
      
      if (!result.canceled && result.assets[0]) {
        console.log('🔍 Document scanned, processing...');
        await processDocument(result.assets[0], true);
      } else {
        console.log('🔍 Document scan cancelled');
      }
    } catch (error) {
      console.error('Error scanning document:', error);
      Alert.alert('Error', 'Failed to scan document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (asset: any, isScanned = false) => {
    console.log('📄 Processing document:', asset);
    try {
      const documentName = asset.name || `${isScanned ? 'Scanned' : 'Uploaded'} Document`;
      const documentSize = asset.size ? `${(asset.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size';
      
      console.log('📄 Document details:', { name: documentName, size: documentSize, uri: asset.uri });
      
      // Determine document type based on filename or let user choose
      let documentType = 'other';
      const nameLower = documentName.toLowerCase();
      if (nameLower.includes('passport')) documentType = 'passport';
      else if (nameLower.includes('visa')) documentType = 'visa';
      else if (nameLower.includes('ticket') || nameLower.includes('flight')) documentType = 'ticket';
      else if (nameLower.includes('insurance')) documentType = 'insurance';
      else if (nameLower.includes('vaccination') || nameLower.includes('vaccine')) documentType = 'vaccination';

      const newDocument: Document = {
        id: Date.now().toString(),
        name: documentName,
        type: documentType as any,
        dateAdded: new Date().toISOString().split('T')[0],
        size: documentSize,
        status: 'valid',
        uri: asset.uri,
        mimeType: asset.mimeType,
      };

      console.log('📄 New document created:', newDocument);
      
      setDocuments(prev => [newDocument, ...prev]);
      
      console.log('✅ Document added to list');
      
      Alert.alert(
        'Document Added Successfully!',
        `${documentName} has been added to your travel documents.`,
        [
          {
            text: 'View Document',
            onPress: () => viewDocument(newDocument),
          },
          { text: 'OK' },
        ]
      );
      
    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert('Error', 'Failed to process document. Please try again.');
    }
  };

  const viewDocument = (doc: Document) => {
    console.log('👁️ Viewing document:', doc.name);
    if (doc.uri) {
      // For uploaded documents, we can show them
      Alert.alert(
        'View Document',
        `Document: ${doc.name}\nType: ${doc.type}\nSize: ${doc.size}\nAdded: ${new Date(doc.dateAdded).toLocaleDateString('en-GB')}`,
        [
          {
            text: 'Open',
            onPress: () => {
              // In a real app, you'd open the document viewer
              console.log('Opening document:', doc.uri);
              Alert.alert('Document Viewer', 'Document viewer would open here in a full app.');
            },
          },
          { text: 'Close' },
        ]
      );
    } else {
      Alert.alert(
        'View Document', 
        `Document: ${doc.name}\nType: ${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}\nSize: ${doc.size}\nAdded: ${new Date(doc.dateAdded).toLocaleDateString('en-GB')}${doc.expiryDate ? `\nExpires: ${new Date(doc.expiryDate).toLocaleDateString('en-GB')}` : ''}\nStatus: ${doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}`,
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const shareDocument = (doc: Document) => {
    console.log('📤 Sharing document:', doc.name);
    Alert.alert(
      'Share Document', 
      `Share ${doc.name} via:`,
      [
        { text: 'Email', onPress: () => console.log('Share via email') },
        { text: 'Message', onPress: () => console.log('Share via message') },
        { text: 'AirDrop', onPress: () => console.log('Share via AirDrop') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const deleteDocument = (docId: string) => {
    console.log('🗑️ Deleting document:', docId);
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== docId));
            console.log('✅ Document deleted');
            Alert.alert('Success', 'Document deleted successfully.');
          },
        },
      ]
    );
  };

  const renderDocument = (doc: Document) => (
    <View key={doc.id} style={styles.documentCard}>
      {doc.uri && doc.mimeType?.startsWith('image/') && (
        <Image source={{ uri: doc.uri }} style={styles.documentPreview} />
      )}
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <View style={styles.documentIcon}>
            {getDocumentIcon(doc.type)}
          </View>
          <View style={styles.documentDetails}>
            <Text style={styles.documentName}>{doc.name}</Text>
            <View style={styles.documentMeta}>
              <Text style={styles.documentSize}>{doc.size}</Text>
              <Text style={styles.documentDate}>
                Added {new Date(doc.dateAdded).toLocaleDateString('en-GB')}
              </Text>
              {doc.uri && (
                <Text style={styles.uploadedIndicator}>📱 Uploaded</Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.documentStatus}>
          {getStatusIcon(doc.status)}
          <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
            {doc.status}
          </Text>
        </View>
      </View>

      {doc.expiryDate && (
        <View style={styles.expiryInfo}>
          <Calendar size={14} color="#64748b" />
          <Text style={styles.expiryText}>
            Expires: {new Date(doc.expiryDate).toLocaleDateString('en-GB')}
          </Text>
        </View>
      )}

      <View style={styles.documentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => viewDocument(doc)}
        >
          <Eye size={16} color="#3b82f6" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => shareDocument(doc)}
        >
          <Share size={16} color="#10b981" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteDocument(doc.id)}
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e40af', '#1d4ed8']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Travel Documents</Text>
        <Text style={styles.headerSubtitle}>Keep your important documents safe</Text>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconComponent
                  size={20}
                  color={isSelected ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.selectedCategoryLabel,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Document Button */}
        <TouchableOpacity 
          style={[styles.addDocumentButton, uploading && styles.addDocumentButtonDisabled]} 
          onPress={addDocument}
          disabled={uploading}
        >
          {uploading ? (
            <Loader size={20} color="#ffffff" />
          ) : (
            <Plus size={20} color="#ffffff" />
          )}
          <Text style={styles.addDocumentText}>
            {uploading ? 'Processing...' : 'Add New Document'}
          </Text>
        </TouchableOpacity>

        {/* Documents List */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>
            {filteredDocuments.length} Document{filteredDocuments.length !== 1 ? 's' : ''}
          </Text>
          {filteredDocuments.map(renderDocument)}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>📋 Document Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              • Keep digital copies of all important documents{'\n'}
              • Store documents in cloud storage for backup{'\n'}
              • Check passport expiry dates (6+ months validity required){'\n'}
              • Carry physical copies separately from originals{'\n'}
              • Take photos of documents on your phone{'\n'}
              • Know your embassy contact information{'\n'}
              • Keep emergency contact details accessible
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  categoriesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedCategory: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  selectedCategoryLabel: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 8,
  },
  addDocumentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addDocumentButtonDisabled: {
    opacity: 0.6,
  },
  documentPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  uploadedIndicator: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  documentsSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  documentSize: {
    fontSize: 12,
    color: '#64748b',
  },
  documentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  expiryText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  documentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tipsSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
});

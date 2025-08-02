import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Download, Loader } from 'lucide-react-native';

interface DownloadButtonProps {
  type: 'source' | 'build';
  style?: any;
}

export default function DownloadButton({ type, style }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Downloads are only available in web browser');
      return;
    }

    setDownloading(true);
    
    try {
      const response = await fetch(`/download?type=${type}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `travel-app-${type}-${Date.now()}.tar.gz`;
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      Alert.alert('Success', `${type === 'source' ? 'Source code' : 'Build files'} downloaded successfully!`);
      
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download files. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style, downloading && styles.buttonDisabled]}
      onPress={handleDownload}
      disabled={downloading}
    >
      {downloading ? (
        <Loader size={16} color="#ffffff" />
      ) : (
        <Download size={16} color="#ffffff" />
      )}
      <Text style={styles.buttonText}>
        {downloading 
          ? 'Preparing...' 
          : `Download ${type === 'source' ? 'Source' : 'Build'}`
        }
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
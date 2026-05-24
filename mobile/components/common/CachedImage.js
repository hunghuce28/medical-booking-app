import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, Text } from 'react-native';

/**
 * Component hiển thị ảnh tự động cache và tối ưu cho định dạng WebP
 * Sử dụng thư viện expo-image
 */
export default function CachedImage({ 
  source, 
  style, 
  placeholder = 'blur',
  contentFit = 'cover',
  fallbackText = 'Image',
  ...props 
}) {
  const isWebUrl = typeof source === 'string' && source.startsWith('http');
  const imageSource = isWebUrl ? { uri: source } : source;

  return (
    <Image
      style={[styles.image, style]}
      source={imageSource}
      placeholder={placeholder}
      contentFit={contentFit}
      transition={200}
      cachePolicy="disk" // Ép buộc lưu cache xuống đĩa
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e1e4e8', // Màu nền hiển thị khi đang tải ảnh
  },
});

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '@/firebase';

/**
 * Firebase Storage API service
 * Handles file upload, download, and management operations
 */
export const storageApi = {
  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  },

  /**
   * Upload player image
   */
  async uploadPlayerImage(file: File, playerId: string): Promise<string> {
    const path = `players/${playerId}/${file.name}`;
    return this.uploadFile(file, path);
  },

  /**
   * Upload team logo
   */
  async uploadTeamLogo(file: File, teamId: string): Promise<string> {
    const path = `teams/${teamId}/${file.name}`;
    return this.uploadFile(file, path);
  },

  /**
   * Get download URL for a file
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to get download URL');
    }
  },

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  },

  /**
   * List all files in a directory
   */
  async listFiles(path: string): Promise<string[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      return result.items.map(item => item.fullPath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  },

  /**
   * Get file metadata
   */
  async getFileMetadata(path: string) {
    try {
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  },

  /**
   * Generate a unique file path
   */
  generateFilePath(folder: string, fileName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = fileName.split('.').pop();
    return `${folder}/${timestamp}_${randomId}.${extension}`;
  },

  /**
   * Validate file type and size
   */
  validateFile(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: number = 5 * 1024 * 1024 // 5MB
  ): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum size ${(maxSize / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return { valid: true };
  }
};
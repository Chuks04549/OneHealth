import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const PHOTO_DIRECTORY = `${FileSystem.documentDirectory || ''}meal-photos/`;

function extensionFromUri(uri) {
  const match = String(uri).match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'jpg';
}

export async function persistMealPhoto(uri) {
  if (!uri || Platform.OS === 'web' || !FileSystem.documentDirectory) return uri || null;
  if (uri.startsWith(PHOTO_DIRECTORY)) return uri;

  await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
  const destination = `${PHOTO_DIRECTORY}meal-${Date.now()}.${extensionFromUri(uri)}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}

export async function deletePersistedMealPhoto(uri) {
  if (!uri || !PHOTO_DIRECTORY || !uri.startsWith(PHOTO_DIRECTORY)) return;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
}

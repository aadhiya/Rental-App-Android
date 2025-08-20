// utils/photoUtils.js

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Returns a sanitized string for filenames (lowercase, alphanum + underscores)
export const sanitize = (str) => str.replace(/[^a-z0-9]/gi, '_').toLowerCase();

// Saves a photo to 'rents' album with a custom name: <customerName>_<photoType>_<timestamp>.<ext>
export const savePhotoToRents = async (uri, customerName, photoType) => {
  const timestamp = Date.now();
  const sanitized = sanitize(customerName);
  const extMatch = uri.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const filename = `${sanitized}_${photoType}_${timestamp}.${ext}`;
  const newUri = FileSystem.cacheDirectory + filename;

  // Move/rename the image
  await FileSystem.moveAsync({ from: uri, to: newUri });

  // Save in gallery/albums
  const asset = await MediaLibrary.createAssetAsync(newUri);
  let album = await MediaLibrary.getAlbumAsync('rents');
  if (!album) {
    album = await MediaLibrary.createAlbumAsync('rents', asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
  // At the end of savePhotoToRents:
return { asset, localUri: newUri };

};

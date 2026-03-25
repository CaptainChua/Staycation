import { upload_file } from './cloudinary';

export const upload_image_from_form = async (
  file: File,
  folder: string
): Promise<{ public_id: string; url: string }> => {
  try {
    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert buffer to base64
    const base64 = buffer.toString('base64');
    
    // Create data URL with proper MIME type
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    // Upload to Cloudinary
    const result = await upload_file(dataUrl, folder);
    
    return result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error}`);
  }
};

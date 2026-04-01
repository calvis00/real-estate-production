import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'properties',
            resource_type: 'auto', // Detect image vs video automatically
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };
    },
});
export const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video/images
});
//# sourceMappingURL=upload.js.map
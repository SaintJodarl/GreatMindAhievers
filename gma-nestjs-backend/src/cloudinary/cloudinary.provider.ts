import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY_PROVIDER = 'CLOUDINARY';

export const CloudinaryProvider = {
  provide: CLOUDINARY_PROVIDER,
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, ''),
      api_key: process.env.CLOUDINARY_API_KEY?.replace(/['"]/g, ''),
      api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/['"]/g, ''),
    });
  },
};

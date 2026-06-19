"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryProvider = exports.CLOUDINARY_PROVIDER = void 0;
const cloudinary_1 = require("cloudinary");
exports.CLOUDINARY_PROVIDER = 'CLOUDINARY';
exports.CloudinaryProvider = {
    provide: exports.CLOUDINARY_PROVIDER,
    useFactory: () => {
        return cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    },
};
//# sourceMappingURL=cloudinary.provider.js.map
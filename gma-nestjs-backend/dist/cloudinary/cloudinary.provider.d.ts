export declare const CLOUDINARY_PROVIDER = "CLOUDINARY";
export declare const CloudinaryProvider: {
    provide: string;
    useFactory: () => import("cloudinary").ConfigOptions;
};

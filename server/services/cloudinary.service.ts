import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId?: string;
  format?: string;
  bytes?: number;
}

export class CloudinaryService {
  async uploadDoctorKycDocument(
    userId: string,
    docType: string,
    fileBase64: string,
    fileName: string,
    mimeType: string = "application/pdf"
  ): Promise<CloudinaryUploadResult> {
    const cleanUserId = userId.replace(/\s+/g, "_");
    const isPdf =
      mimeType.includes("pdf") ||
      fileName.toLowerCase().endsWith(".pdf") ||
      fileBase64.startsWith("data:application/pdf");

    if (!isCloudinaryConfigured) {
      console.warn("⚠️ [Cloudinary] Credentials not set in .env, using local fallback URL.");
      return {
        secureUrl: fileBase64.startsWith("data:")
          ? fileBase64
          : `/uploads/doctors/${cleanUserId}/${fileName}`,
        publicId: `local_${cleanUserId}_${docType}`,
      };
    }

    try {
      // For PDFs, Cloudinary requires resource_type: "raw" with explicit .pdf extension
      // For Images, resource_type: "image" is used
      const resourceType: "raw" | "image" = isPdf ? "raw" : "image";
      const publicId = isPdf
        ? `${docType}_${Date.now()}.pdf`
        : `${docType}_${Date.now()}`;

      const uploadRes = await cloudinary.uploader.upload(fileBase64, {
        folder: `medsevasetu/doctors/${cleanUserId}`,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      });

      console.log(`☁️ [Cloudinary Success] Uploaded ${docType} (${resourceType}) for user ${cleanUserId}: ${uploadRes.secure_url}`);

      return {
        secureUrl: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        format: uploadRes.format,
        bytes: uploadRes.bytes,
      };
    } catch (err: any) {
      console.error("❌ Cloudinary upload failed:", err);
      return {
        secureUrl: fileBase64.startsWith("data:")
          ? fileBase64
          : `/uploads/doctors/${cleanUserId}/${fileName}`,
        publicId: `fallback_${cleanUserId}_${docType}`,
      };
    }
  }

  async deleteDocument(publicId: string): Promise<boolean> {
    if (
      !isCloudinaryConfigured ||
      !publicId ||
      publicId.startsWith("local_") ||
      publicId.startsWith("fallback_")
    ) {
      return true;
    }

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
      return true;
    } catch (err) {
      console.error("❌ Cloudinary delete error:", err);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();

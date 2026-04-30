import api from '@/lib/api';

export type UploadPath = 'PROFILE_IMAGE' | 'VIDEO' | 'IMAGE';

export interface PresignedUrlResponse {
    uploadUrl: string;
    key: string;
    fullUrl: string;
    expiresAt: string;
}

export const mediaService = {
    /**
     * Generates a presigned URL for uploading a file to S3.
     */
    generatePresignedUrl: async (path: UploadPath, fileExtension: string): Promise<PresignedUrlResponse> => {
        const response = await api.post('/media/upload', null, {
            params: { path, fileExtension }
        });
        return response.data;
    },

    /**
     * Generates presigned URLs for multiple file uploads to S3 in a single request.
     */
    batchGeneratePresignedUrls: async (path: UploadPath, files: File[]): Promise<{ files: PresignedUrlResponse[] }> => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await api.post('/media/upload/batch', formData, {
            params: { path },
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response.data;
    },

    /**
     * Uploads multiple files to S3 by generating presigned URLs and uploading them concurrently.
     * Returns an array of full URLs of the uploaded files.
     */
    uploadBatchFiles: async (path: UploadPath, files: File[]): Promise<string[]> => {
        if (!files || files.length === 0) return [];

        const presignedData = await mediaService.batchGeneratePresignedUrls(path, files);
        
        const uploadPromises = files.map((file, index) => {
            const presignedInfo = presignedData.files[index];
            return mediaService.uploadFileToS3(presignedInfo.uploadUrl, file).then(() => presignedInfo.fullUrl);
        });

        const fullUrls = await Promise.all(uploadPromises);
        return fullUrls;
    },

    /**
     * Uploads a file to S3 using a presigned URL.
     * Uses fetch with ArrayBuffer to ensure the binary data is sent correctly as the request body.
     */
    uploadFileToS3: async (uploadUrl: string, file: File): Promise<void> => {
        const response = await fetch(uploadUrl, {
            method: 'PUT',
            body: await file.arrayBuffer(),
            headers: {
                'Content-Type': file.type
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to upload to S3: ${response.statusText}`);
        }

        console.log(response);
    },

    /**
     * Deletes a file from S3 given its key.
     */
    deleteFile: async (key: string): Promise<void> => {
        await api.delete('/media', {
            params: { key }
        });
    }
};

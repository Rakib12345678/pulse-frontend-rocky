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

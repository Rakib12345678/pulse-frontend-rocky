import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

// ---- Types ----

export interface ReportReason {
    value: string;
    label: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    requiresNote: boolean;
}

export type ReportContentType = 'CHAT_MESSAGE' | 'LIVE_STREAM' | 'USER_PROFILE';

export interface SubmitReportPayload {
    reportedUserId: number | string;
    contentType: ReportContentType;
    contentId: string;
    reason: string;
    note?: string;
    contextMetadata?: Record<string, unknown>;
}

export interface SubmitReportResponse {
    id: number;
    reporterId: string;
    reportedUserId: string;
    contentType: ReportContentType;
    contentId: string;
    reason: string;
    priority: string;
    note: string;
    contextMetadata: Record<string, unknown>;
    createdAt: string;
}

// ---- Fetch report reasons ----

const fetchReportReasons = async (): Promise<ReportReason[]> => {
    const { data } = await api.get('/reports/reasons');
    return data;
};

export const useReportReasons = () => {
    return useQuery({
        queryKey: queryKeys.reports.reasons(),
        queryFn: fetchReportReasons,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });
};

// ---- Submit a report ----

const submitReport = async (payload: SubmitReportPayload): Promise<SubmitReportResponse> => {
    const { data } = await api.post('/reports', payload);
    return data;
};

export const useSubmitReport = () => {
    return useMutation<SubmitReportResponse, unknown, SubmitReportPayload>({
        mutationFn: submitReport,
    });
};

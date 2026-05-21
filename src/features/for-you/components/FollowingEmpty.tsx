import React from 'react';
import { Video } from 'lucide-react';

export const FollowingEmpty: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Video className="h-16 w-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Following Streams</h2>
            <p className="text-gray-200 text-sm">Streams from creators you follow will appear here.</p>
        </div>
    );
};

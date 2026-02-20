import { SettingsPage } from '@/features/setting/components/Settings';

export const Settings = () => {
    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#0d0d0d] flex items-start justify-center px-8 py-10">
            <div
                className="relative w-full overflow-hidden"
                style={{
                    maxWidth: 1136,
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#161616',
                    boxShadow: '0 8px 64px 0 rgba(0,0,0,0.6)',
                }}
            >         
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 169,
                        height: 220,
                        top: -108,
                        right: -92,
                        background: '#FF7700',
                        filter: 'blur(180px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 220,
                        height: 220,
                        bottom: -110,
                        left: -110,
                        background: '#3E2AB5',
                        filter: 'blur(354px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />

                <div className="relative z-10 w-full">
                    <SettingsPage />
                </div>
            </div>
        </div>
    );
};
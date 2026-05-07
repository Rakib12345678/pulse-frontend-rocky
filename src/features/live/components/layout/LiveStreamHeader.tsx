import React from 'react';
import { Users, Eye, EyeOff, ArrowLeft, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoLiveStore } from '@/features/live/stores/goLiveStore';
import { liveService } from '@/features/live/services/live.service';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { EndLiveModal } from '@/features/live/components/modals/EndLiveModal';
import { useSubmitReport } from '@/features/report/services/report.service';
import { ReportStreamModal, TargetUserOption, ReportLimitModal, ReportSuccessModal, ReportFailureModal } from '@/components/internal/ReasonModal';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

import { ParticipantsDialog } from '@/features/live/components/modals/ParticipantsDialog';
import { useViewerVisibilityStore } from '@/features/live/stores/participantPresenceStore';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LiveStreamHeader: React.FC = () => {
    const { streamData, setEndingStream } = useGoLiveStore();
    const { isChatVisible, setChatVisible, call } = useLiveStreamContext();
    const navigate = useNavigate();
    const { useCallSession, useParticipants, useCallCreatedBy } = useCallStateHooks();
    const session = useCallSession();
    const participants = useParticipants();
    const createdBy = useCallCreatedBy();
    const { mutate: submitReport, isPending: isReportPending } = useSubmitReport();
    const { user: currentUser } = useAuthStore();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();

    const handleReportClick = () => {
        if (!currentUser) {
            setMode('login');
            setStep('input');
            openLoginModal();
            return;
        }
        setIsReportOpen(true);
    };

    // STRICT SECURITY: Verify they are the actual creator, not just a co-host
    const isTrueCreator = createdBy?.id === String(currentUser?.id);

    // Compute presence-aware participant count (excludes hidden viewers)
    const { hiddenUsers } = useViewerVisibilityStore();
    const displayCount = participants.filter((p: any) => {
        // Exclude the creator (host) from the viewer count
        const isCreator = p.roles?.includes('host') || p.roles?.includes('admin') || p.userId === createdBy?.id;
        if (isCreator) return false;
        if (p.connectionQuality === 'offline' || !p.sessionId) return false;
        // Always count local participant
        if (p.isLocalParticipant) return true;
        // Always count co-hosts
        const isCoHost = p.roles?.includes('co_host') ||
            p.capabilities?.includes('send-audio') ||
            p.capabilities?.includes('send-video');
        if (isCoHost) return true;
        // Viewers: Only count them if their ID is NOT in the hiddenUsers Set
        return !hiddenUsers.has(p.userId);
    }).length;
    const isMobile = useIsMobile();

    // Timer state
    const [timeLeft, setTimeLeft] = React.useState<string>('');
    const [hasShownAlert, setHasShownAlert] = React.useState(false);
    const [isUrgent, setIsUrgent] = React.useState(false);

    // Auto-end stream ref
    const autoEndTriggered = React.useRef(false);

    // End Live Modal State
    const [isEndModalOpen, setIsEndModalOpen] = React.useState(false);
    const [isAutoEnding, setIsAutoEnding] = React.useState(false);
    const [isEndingProcess, setIsEndingProcess] = React.useState(false);
    const [showDurationPopup, setShowDurationPopup] = React.useState(false);
    const [streamDuration, setStreamDuration] = React.useState(0); // in seconds
    const startTimestampRef = React.useRef<number | null>(null);
    const [isReportOpen, setIsReportOpen] = React.useState(false);
    const [showReportSuccess, setShowReportSuccess] = React.useState(false);
    const [failedReportData, setFailedReportData] = React.useState<{ reportedUserId: string, reasonId: string, otherText?: string } | null>(null);
    const [showReportLimitModal, setShowReportLimitModal] = React.useState(false);

    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionWithTimer = session as any;

        if (!sessionWithTimer?.timer_ends_at) {
            setTimeLeft('');
            return;
        }

        const checkTime = async () => {
            const endsAt = new Date(sessionWithTimer.timer_ends_at).getTime();
            const now = Date.now();
            const diff = endsAt - now;

            if (diff <= 750 && !autoEndTriggered.current && isHost) {
                autoEndTriggered.current = true;
                setIsAutoEnding(true);
                setIsEndModalOpen(true);
                toast.warning('Session limit reached! Ending soon...', {
                    duration: 15000,
                    className: "bg-red-500 text-white font-bold border-none"
                });
                return;
            }

            if (diff <= 0) {
                setTimeLeft('00:00');
                setIsUrgent(true);
                return;
            }

            if (diff <= 120000 && diff > 119000 && !hasShownAlert) {
                toast.warning('2 minutes remaining in session', {
                    duration: 5000,
                    className: "bg-yellow-500 text-black font-bold border-none"
                });
                setHasShownAlert(true);
            }

            if (diff <= 30000) {
                setIsUrgent(true);
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        checkTime();
        const interval = setInterval(checkTime, 1000);

        // Track stream duration
        if (!startTimestampRef.current) {
            startTimestampRef.current = Date.now();
        }
        const durationInterval = setInterval(() => {
            if (startTimestampRef.current) {
                setStreamDuration(Math.floor((Date.now() - startTimestampRef.current) / 1000));
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(durationInterval);
        };
    }, [session, hasShownAlert, streamData, navigate, setEndingStream]);

    const handleLeaveStream = async () => {
        try {
            if (call) {
                await call.camera.disable();
                await call.microphone.disable();
                await call.leave();
            }
            navigate({ to: '/for-you' });
        } catch (error) {
            console.error('Failed to leave stream:', error);
            navigate({ to: '/for-you' });
        }
    };

    const handleEndLiveChoice = React.useCallback(async (save: boolean) => {
        if (!streamData) return;
        setIsEndingProcess(true);
        // Set ending stream flag immediately to bypass navigation blockers
        setEndingStream(true);

        try {
            // CRITICAL: Stop local media tracks BEFORE ending the call.
            // call.camera.disable() only stops publishing — it does NOT release
            // the MediaStreamTrack hardware, so the browser will keep showing
            // the camera/mic indicator. We must explicitly stop() every track
            // to fully release the camera & microphone permissions.
            if (call) {
                const localParticipant = call.state.localParticipant;
                if (localParticipant) {
                    localParticipant.videoStream?.getTracks().forEach(track => {
                        track.stop();
                    });
                    localParticipant.audioStream?.getTracks().forEach(track => {
                        track.stop();
                    });
                }
                await call.camera.disable().catch(() => {});
                await call.microphone.disable().catch(() => {});
            }

            await liveService.endLiveStream(streamData.callId, save);
            if (call) {
                await call.endCall();
            }

            // Reset the host stream data so LiveStreamLayout's cleanup
            // fully tears down and RejoinStreamBanner doesn't appear
            useGoLiveStore.getState().reset();
            localStorage.removeItem('pulse_host_is_currently_live');
            localStorage.removeItem('pulse_host_left_at');

            const durationMins = streamDuration / 60;
            if (save && durationMins >= 10) {
                setShowDurationPopup(true);
                // Navigation will happen when modal is closed
            } else {
                navigate({ to: '/for-you' });
            }
        } catch (error) {
            console.error('Failed to end live stream:', error);
            // Revert flag on error so user can try again
            setEndingStream(false);
            toast.error("Failed to end stream. Please try again.");
        } finally {
            setIsEndingProcess(false);
            setIsEndModalOpen(false);
        }
    }, [streamData, call, streamDuration, navigate, setEndingStream]);

    const handleEndLiveClick = () => {
        if (isHost) {
            setIsEndModalOpen(true);
        }
    };

    const isHost = !!streamData;
    const hostName = createdBy?.name || createdBy?.id || 'Host';

    const usersToReport = React.useMemo(() => {
        const users: TargetUserOption[] = [];
        if (createdBy) {
            users.push({ id: createdBy.id, username: hostName, isHost: true });
        }
        participants.forEach((p: any) => {
            const isParticipantHost = p.roles?.includes('host') || p.roles?.includes('admin') || p.userId === createdBy?.id;
            const isCoHost = p.roles?.includes('co_host') || p.capabilities?.includes('send-audio') || p.capabilities?.includes('send-video');
            if (!isParticipantHost && isCoHost) {
                users.push({ id: p.userId, username: p.name || p.userId, isHost: false });
            }
        });
        return users;
    }, [createdBy, participants, hostName]);

    /* ========== MOBILE HEADER ========== */
    return (
        <>
            {/* ========== MOBILE HEADER ========== */}
            {isMobile ? (
                <>
                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-5 pb-3 bg-linear-to-b from-black/60 to-transparent">
                        <div className="flex items-center gap-2">
                            {isHost ? (
                                /* Host: red End Live with back icon */
                                <button
                                    onClick={handleEndLiveClick}
                                    className="flex items-center gap-1 text-red-500 font-bold text-base"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                    <span>End Live</span>
                                </button>
                            ) : (
                                /* Viewer: back + host username */
                                <>
                                    <button
                                        onClick={handleLeaveStream}
                                        className="text-white"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <span className="text-white font-bold text-base truncate max-w-[200px]">
                                        {hostName}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Center: timer */}
                        {isHost && timeLeft && (
                            <div className="absolute left-1/2 -translate-x-1/2">
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border transition-colors ${isUrgent
                                    ? "bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
                                    : "bg-white/10 border-white/10 text-white"
                                    }`}>
                                    <span>{timeLeft}</span>
                                </div>
                            </div>
                        )}

                        {/* Right side: "..." menu for viewer */}
                        <div className="flex items-center gap-2">
                            {!isHost && (
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                                            <MoreHorizontal className="w-5 h-5 text-white" />
                                        </button>
                                    </DrawerTrigger>
                                    <DrawerContent className="bg-[#1C1C1E] border-none text-white outline-none">
                                        <DrawerTitle className="sr-only">Stream Options</DrawerTitle>
                                        <DrawerDescription className="sr-only">Report or show interest in the stream</DrawerDescription>
                                        <div className="flex flex-col px-4 py-6 max-w-sm mx-auto w-full">
                                            <button className="text-left px-4 py-4 text-xl font-medium hover:bg-white/10 rounded-t-xl transition-colors">
                                                Interested
                                            </button>
                                            <div className="h-px bg-white/10 w-full" />
                                            <button
                                                className="text-left px-4 py-4 text-xl font-medium hover:bg-white/10 rounded-b-xl transition-colors"
                                                onClick={handleReportClick}
                                            >
                                                Report Stream
                                            </button>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            )}
                        </div>
                    </div>

                    {/* Left side buttons (below header): eye + participants */}
                    <div className="absolute top-24 left-4 z-20 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => setChatVisible(!isChatVisible)}
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                            title={isChatVisible ? "Hide Chat" : "Show Chat"}
                        >
                            {isChatVisible ? <Eye className="w-4 h-4 text-white/70" /> : <EyeOff className="w-4 h-4 text-white/70" />}
                        </button>

                        {isTrueCreator && displayCount !== 0 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                        <Users className="w-4 h-4 text-white/70" />
                                    </button>
                                </DialogTrigger>
                                <ParticipantsDialog />
                            </Dialog>
                        )}
                    </div>
                </>
            ) : (
                /* ========== DESKTOP HEADER ========== */
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-linear-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-4">
                        {isHost ? (
                            <Button
                                onClick={handleEndLiveClick}
                                className="bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-6 py-2 rounded-full h-11 transition-all hover:scale-105 active:scale-95"
                            >
                                End Live
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleLeaveStream}
                                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                                    title="Leave Stream"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </button>
                                <div className="flex items-center gap-2 bg-[#FFD580] px-4 py-1.5 rounded-full text-black">
                                    <Users className="w-4 h-4 text-black" />
                                    <span className="text-sm font-bold">{displayCount >= 1000 ? `${(displayCount / 1000).toFixed(1)}k` : displayCount}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pr-16">
                        <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            Live
                        </div>

                        {isHost && timeLeft && (
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border transition-colors ${isUrgent
                                ? "bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
                                : "bg-white/10 border-white/10 text-white"
                                }`}>
                                <span>{timeLeft}</span>
                            </div>
                        )}

                        {isTrueCreator && displayCount !== 0 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
                                        <Users className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-bold">{displayCount}</span>
                                    </div>
                                </DialogTrigger>
                                <ParticipantsDialog />
                            </Dialog>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setChatVisible(!isChatVisible)}
                            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                            title={isChatVisible ? "Hide Chat" : "Show Chat"}
                        >
                            {isChatVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>

                        {!isHost && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                                    >
                                        <MoreHorizontal className="w-5 h-5 text-white/70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="bottom" align="end" className="bg-[#1C1C1E] border-none shadow-lg text-white min-w-[200px] p-2 rounded-xl">
                                    <DropdownMenuItem className="cursor-pointer px-4 py-3 text-[16px] font-medium hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg transition-colors">
                                        Interested
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10 my-1" />
                                    <DropdownMenuItem
                                        className="cursor-pointer px-4 py-3 text-[16px] font-medium hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg transition-colors"
                                        onClick={handleReportClick}
                                    >
                                        Report Stream
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            )}

            <EndLiveModal
                isOpen={isEndModalOpen}
                onClose={() => {
                    if (!isAutoEnding) setIsEndModalOpen(false);
                }}
                onEnd={handleEndLiveChoice}
                isLoading={isEndingProcess}
                autoEndCountdown={isAutoEnding ? 15 : undefined}
            />

            {/* Duration Summary Modal */}
            <Dialog open={showDurationPopup} onOpenChange={(open) => {
                if (!open) {
                    setShowDurationPopup(false);
                    navigate({ to: '/for-you' });
                }
            }}>
                <DialogContent className="bg-[#1C1C1E] border-white/5 rounded-3xl sm:max-w-md p-8 gap-6 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#FF8800]/10 flex items-center justify-center mb-2">
                        <div className="w-16 h-16 rounded-full bg-[#FF8800]/20 flex items-center justify-center">
                            <Users className="w-8 h-8 text-[#FF8800]" />
                        </div>
                    </div>
                    <DialogTitle className="text-3xl font-bold text-white tracking-tight">Session Summary</DialogTitle>
                    <div className="space-y-1">
                        <p className="text-gray-400 text-lg">You were live for</p>
                        <p className="text-[#FF8800] text-4xl font-black">{Math.floor(streamDuration / 60)}m {streamDuration % 60}s</p>
                    </div>
                    <DialogDescription className="text-gray-500 text-base">
                        Amazing session! Your recording has been saved to your profile for your followers to watch.
                    </DialogDescription>
                    <Button
                        onClick={() => {
                            setShowDurationPopup(false);
                            navigate({ to: '/for-you' });
                        }}
                        className="w-full py-7 rounded-full bg-[#FF8800] text-black font-bold text-lg hover:bg-[#ff9d2e] active:scale-95 transition-all shadow-lg mt-4"
                    >
                        Great!
                    </Button>
                </DialogContent>
            </Dialog>

            <ReportStreamModal
                isOpen={isReportOpen}
                isLoading={isReportPending}
                usersToReport={usersToReport}
                onCancel={() => setIsReportOpen(false)}
                onConfirm={(reasonId, otherText, reportedUserId) => {
                    submitReport(
                        {
                            reportedUserId: reportedUserId || createdBy?.id || '',
                            contentType: 'LIVE_STREAM',
                            contentId: streamData?.callId || call?.id || '',
                            reason: reasonId,
                            note: otherText,
                        },
                        {
                            onSuccess: () => {
                                setIsReportOpen(false);
                                setShowReportSuccess(true);
                            },
                            onError: (error: any) => {
                                if (error?.response?.status === 429) {
                                    setIsReportOpen(false);
                                    setShowReportLimitModal(true);
                                } else {
                                    setFailedReportData({ reportedUserId: reportedUserId || createdBy?.id || '', reasonId, otherText });
                                    setIsReportOpen(false);
                                }
                            },
                        }
                    );
                }}
            />

            <ReportLimitModal
                isOpen={showReportLimitModal}
                onTryLater={() => setShowReportLimitModal(false)}
                onExplore={() => {
                    setShowReportLimitModal(false);
                }}
            />

            <ReportSuccessModal
                isOpen={showReportSuccess}
                username={hostName}
                type="other"
                onExplore={() => {
                    setShowReportSuccess(false);
                    handleLeaveStream();
                }}
                onClose={() => setShowReportSuccess(false)}
            />

            <ReportFailureModal
                isOpen={!!failedReportData}
                onTryAgain={() => {
                    if (failedReportData) {
                        submitReport(
                            {
                                reportedUserId: failedReportData.reportedUserId,
                                contentType: 'LIVE_STREAM',
                                contentId: streamData?.callId || call?.id || '',
                                reason: failedReportData.reasonId,
                                note: failedReportData.otherText,
                            },
                            {
                                onSuccess: () => {
                                    setShowReportSuccess(true);
                                },
                                onError: (error: any) => {
                                    if (error?.response?.status === 429) {
                                        setShowReportLimitModal(true);
                                    } else {
                                        setFailedReportData({ reportedUserId: failedReportData.reportedUserId, reasonId: failedReportData.reasonId, otherText: failedReportData.otherText });
                                    }
                                },
                            }
                        );
                        setFailedReportData(null);
                    }
                }}
                onCancel={() => setFailedReportData(null)}
            />
        </>
    );
};

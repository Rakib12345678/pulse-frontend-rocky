import React, { useEffect, useState, useRef } from 'react';
import { giftsService, type GiftEntity, type CreateGiftRequest } from '../services/gifts.service';
import { mediaService } from '@/features/auth/services/media.service';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const GiftsAdminManager = () => {
    const [gifts, setGifts] = useState<GiftEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGift, setEditingGift] = useState<GiftEntity | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [noOfCoin, setNoOfCoin] = useState<number | ''>('');

    // Image Upload State
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [existingImageUrl, setExistingImageUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadGifts = async () => {
        setIsLoading(true);
        try {
            const data = await giftsService.getGifts();
            setGifts([...data].sort((a, b) => a.noOfCoin - b.noOfCoin));
        } catch (error) {
            console.error('Failed to load gifts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGifts();
    }, []);

    const handleOpenAdd = () => {
        setEditingGift(null);
        setName('');
        setNoOfCoin('');
        setSelectedImage(null);
        setPreviewUrl('');
        setExistingImageUrl('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (gift: GiftEntity) => {
        setEditingGift(gift);
        setName(gift.name);
        setNoOfCoin(gift.noOfCoin);
        setSelectedImage(null);
        setPreviewUrl('');
        setExistingImageUrl(gift.iconUrl);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this gift?')) return;
        try {
            await giftsService.deleteGift(id);
            await loadGifts();
        } catch (error) {
            console.error('Failed to delete gift:', error);
            alert('Failed to delete gift');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || noOfCoin === '') {
            alert('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalImageUrl = existingImageUrl;

            if (selectedImage) {
                const ext = selectedImage.name.split('.').pop() || 'png';
                const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('IMAGE', ext);
                await mediaService.uploadFileToS3(uploadUrl, selectedImage);
                finalImageUrl = fullUrl;
            }

            if (!finalImageUrl) {
                alert('Please provide a gift icon');
                setIsSubmitting(false);
                return;
            }

            const payload: CreateGiftRequest = {
                name,
                noOfCoin: Number(noOfCoin),
                iconUrl: finalImageUrl
            };

            if (editingGift) {
                await giftsService.updateGift(editingGift.id, payload);
            } else {
                await giftsService.createGift(payload);
            }

            setIsFormOpen(false);
            await loadGifts();

        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to save gift details. Check console for error logs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 text-white max-w-5xl mx-auto font-sans">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold italic">Gifts Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Add, edit, or remove gifts available in the store.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-[#FF8800] hover:bg-[#ff9922] text-black font-bold h-10 px-4 rounded-md flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Gift
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                </div>
            ) : gifts.length === 0 ? (
                <div className="text-center py-20 bg-[#1A1C1E] rounded-xl border border-white/10">
                    <p className="text-gray-400">No gifts found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gifts.map(gift => (
                        <div key={gift.id} className="bg-[#1A1C1E] border border-white/10 rounded-xl p-5 flex flex-col gap-4 relative group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold">{gift.name}</h3>
                                    <p className="text-sm text-gray-400">{gift.noOfCoin} Coins required</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(gift)}
                                        className="p-1.5 bg-[#2D2D2D] hover:bg-white/10 rounded-md text-gray-300 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(gift.id)}
                                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-32 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center border border-white/5 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-[#FF8800]/10 to-transparent">
                                {gift.iconUrl ? (
                                    <img src={gift.iconUrl} alt={gift.name} className="w-20 h-20 object-contain drop-shadow-[0_0_8px_rgba(255,136,0,0.5)]" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-600" />
                                )}
                            </div>

                            <div className="mt-auto flex justify-between items-center pt-3 border-t border-white/10">
                                <span className="text-gray-400 text-sm">Action:</span>
                                <span className="font-bold text-[#FF8800] text-sm italic">
                                    Click to Edit
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="bg-[#1A1C1E] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingGift ? 'Edit Gift' : 'Add New Gift'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-gray-300">Gift Icon *</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden relative group"
                            >
                                {(previewUrl || existingImageUrl) ? (
                                    <img
                                        src={previewUrl || existingImageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <>
                                        <ImageIcon className="w-10 h-10 text-gray-500 mb-2" />
                                        <span className="text-gray-400 text-sm">Click to upload icon</span>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-gray-300">Gift Name *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-black/50 border-white/10 text-white focus-visible:ring-[#FF8800]/50 focus-visible:border-[#FF8800]"
                                placeholder="e.g. Heart"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-gray-300">Coins Required *</Label>
                            <Input
                                type="number"
                                min={1}
                                value={noOfCoin}
                                onChange={(e) => setNoOfCoin(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                className="bg-black/50 border-white/10 text-white focus-visible:ring-[#FF8800]/50 focus-visible:border-[#FF8800]"
                                placeholder="e.g. 100"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-4 bg-[#FF8800] hover:bg-[#ff9922] text-black font-bold h-12"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                editingGift ? 'Save Changes' : 'Create Gift'
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

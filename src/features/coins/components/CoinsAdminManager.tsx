import React, { useEffect, useState, useRef } from 'react';
import { coinsService, type CoinEntity, type CreateCoinRequest } from '../services/coins.service';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const CoinsAdminManager = () => {
    const [coins, setCoins] = useState<CoinEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCoin, setEditingCoin] = useState<CoinEntity | null>(null);

    // Form State
    const [noOfCoin, setNoOfCoin] = useState<number | ''>('');
    const [price, setPrice] = useState<number | ''>('');
    const [currency, setCurrency] = useState<'DOLLER' | 'INR'>('INR');

    // Image Upload State
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [existingImageUrl, setExistingImageUrl] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadCoins = async () => {
        setIsLoading(true);
        try {
            const data = await coinsService.getCoins();
            setCoins([...data].sort((a, b) => a.noOfCoin - b.noOfCoin));
        } catch (error) {
            console.error('Failed to load coins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCoins();
    }, []);

    const handleOpenAdd = () => {
        setEditingCoin(null);
        setNoOfCoin(1);
        setPrice(1);
        setCurrency('INR');
        setSelectedImage(null);
        setPreviewUrl('');
        setExistingImageUrl('');
        setIsFormOpen(true);
    };

    const handleOpenEdit = (coin: CoinEntity) => {
        setEditingCoin(coin);
        setNoOfCoin(coin.noOfCoin);
        setPrice(coin.price);
        setCurrency(coin.currency);
        setSelectedImage(null);
        setPreviewUrl('');
        setExistingImageUrl(coin.bannerImage);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this coin package?')) return;
        try {
            await coinsService.deleteCoin(id);
            await loadCoins();
        } catch (error) {
            console.error('Failed to delete coin:', error);
            alert('Failed to delete coin');
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
        if (!noOfCoin || !price) {
            alert('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            let finalImageUrl = existingImageUrl;

            // 1. Handle Image Upload if a new image was selected
            if (selectedImage) {
                const ext = selectedImage.name.split('.').pop() || 'png';
                // Request a presigned URL for IMAGE upload
                const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('IMAGE', ext);

                // Upload binary data directly to S3
                await mediaService.uploadFileToS3(uploadUrl, selectedImage);

                // Set the final URL to be saved in DB
                finalImageUrl = fullUrl;
            }

            if (!finalImageUrl) {
                alert('Please provide a banner image');
                setIsSubmitting(false);
                return;
            }

            // 2. Prepare payload
            const payload: CreateCoinRequest = {
                noOfCoin: Number(noOfCoin),
                price: Number(price),
                currency,
                bannerImage: finalImageUrl
            };

            // 3. Create or Update via API
            if (editingCoin) {
                await coinsService.updateCoin(editingCoin.id, payload);
            } else {
                await coinsService.createCoin(payload);
            }

            // 4. Cleanup & Refresh
            setIsFormOpen(false);
            await loadCoins();

        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to save coin details. Check console for error logs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 text-white max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold italic">Coins Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Add, edit, or remove coin packages available for purchase.</p>
                </div>
                <Button onClick={handleOpenAdd} className="bg-[#FF8800] hover:bg-[#ff9922] text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Package
                </Button>
            </div>

            {/* Table / Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                </div>
            ) : coins.length === 0 ? (
                <div className="text-center py-20 bg-[#1A1C1E] rounded-xl border border-white/10">
                    <p className="text-gray-400">No coin packages found</p>
                </div>
            ) : (
                <div className="grid pb-15 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coins.map(coin => (
                        <div key={coin.id} className="bg-[#1A1C1E] border border-white/10 rounded-xl p-4 flex flex-col gap-4 relative group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold">{coin.noOfCoin.toLocaleString()}</span>
                                    <span className="text-sm text-gray-400">Coins</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEdit(coin)} className="p-1.5 bg-[#2D2D2D] hover:bg-white/10 rounded-md text-gray-300 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(coin.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Banner Display */}
                            <div className="w-full h-32 bg-black/40 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                                {coin.bannerImage ? (
                                    <img src={coin.bannerImage} alt="Coin banner" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-gray-600" />
                                )}
                            </div>

                            <div className="mt-auto flex justify-between items-end pt-2 border-t border-white/10">
                                <span className="text-gray-400 text-sm">Price:</span>
                                <span className="font-bold text-[#FF8800] text-lg">
                                    {coin.currency === 'INR' ? '₹' : '$'} {coin.price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="bg-[#1A1C1E] border border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCoin ? 'Edit Coin Package' : 'Add New Coin Package'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4">

                        {/* Image Upload Area */}
                        <div className="flex flex-col gap-2">
                            <Label className="text-gray-300">Banner Image *</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-white/5 transition-colors overflow-hidden relative"
                            >
                                {(previewUrl || existingImageUrl) ? (
                                    <img
                                        src={previewUrl || existingImageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                                        <span className="text-gray-400 text-sm">Click to upload image</span>
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

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-gray-300">Number of Coins *</Label>
                                <Input
                                    type="number"
                                    required
                                    min={1}
                                    value={noOfCoin}
                                    onChange={(e) => setNoOfCoin(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                                    className="bg-black/50 border-white/10 text-white focus-visible:ring-[#FF8800]/50 focus-visible:border-[#FF8800]"
                                    placeholder="e.g. 1000"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label className="text-gray-300">Price *</Label>
                                <Input
                                    type="number"
                                    required
                                    min={1}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                                    className="bg-black/50 border-white/10 text-white focus-visible:ring-[#FF8800]/50 focus-visible:border-[#FF8800]"
                                    placeholder="e.g. 499"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-gray-300">Currency *</Label>
                            <Select value={currency} onValueChange={(val) => setCurrency(val as 'DOLLER' | 'INR')}>
                                <SelectTrigger className="w-full bg-black/50 border-white/10 text-white focus:ring-[#FF8800]/50 focus:border-[#FF8800]">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2D2D2D] border-white/10 text-white">
                                    <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                                    <SelectItem value="DOLLER">$ USD (US Dollar)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-4 bg-[#FF8800] hover:bg-[#ff9922] text-black font-bold h-12"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                editingCoin ? 'Save Changes' : 'Create Package'
                            )}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

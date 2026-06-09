import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	CheckCircle2,
	AlertCircle,
	RefreshCw,
	ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { PayoutAccountResponse } from "@/features/coins/services/payment.service";
import { useIsMobile } from "@/hooks/use-mobile";
import { countryCodes, Country } from "@/lib/countries";
import { Search, X } from "lucide-react";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose,
} from "@/components/ui/drawer";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// 1. Withdraw Funds Modal
interface WithdrawFundsModalProps extends ModalProps {
	availableBalance: number;
	bankDetails?: PayoutAccountResponse["bankDetails"];
	onProceed: (amount: number) => void;
}

export const WithdrawFundsModal = ({
	isOpen,
	onClose,
	availableBalance,
	bankDetails,
	onProceed,
}: WithdrawFundsModalProps) => {
	const [amount, setAmount] = useState("");
	const [error, setError] = useState("");

	const handleProceed = () => {
		const numAmount = Number(amount);
		if (!amount || isNaN(numAmount) || numAmount <= 0) {
			setError("Please enter a valid amount");
			return;
		}
		if (numAmount > availableBalance) {
			setError(
				"Note :- Withdrawal Amount Should be lower then and equal to available amount",
			);
			return;
		}
		onProceed(numAmount);
		setAmount("");
		setError("");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-8 rounded-[32px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-left">
						Withdraw Funds
					</DialogTitle>
				</DialogHeader>

				<div className="mt-6 flex flex-col gap-6">
					<div className="bg-[#fff3e6] rounded-2xl p-6 flex justify-between items-center">
						<span className="text-black/60 text-sm font-medium">
							Your Available Balance:
						</span>
						<span className="text-black text-3xl font-bold">
							₹{availableBalance.toLocaleString()}
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-xs text-gray-400 font-medium">Amount</label>
						<div className="relative">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-lg">
								₹
							</span>
							<Input
								type="text"
								value={amount}
								onChange={(e) => {
									const val = e.target.value;
									if (val === "" || /^[0-9]+$/.test(val)) setAmount(val);
								}}
								placeholder="500"
								className="bg-[#1D1F20] border-white/5 h-14 pl-8 rounded-xl text-lg focus:ring-[#FF7700]/50"
							/>
						</div>
						{error && (
							<p className="text-red-500 text-xs mt-1 leading-relaxed">
								{error}
							</p>
						)}
					</div>

					{bankDetails && (
						<div className="bg-[#1D1F20] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
									<div className="w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center text-[10px] font-bold">
										HDFC
									</div>
								</div>
								<div className="flex flex-col">
									<span className="text-sm font-medium">
										{bankDetails.bankName || "Bank Account"}
									</span>
									<span className="text-xs text-gray-400">
										********{bankDetails.last4}
									</span>
								</div>
							</div>
							<button className="text-[#FF7700] text-xs font-medium hover:underline">
								Change Bank Details
							</button>
						</div>
					)}

					<div className="flex gap-4 mt-4">
						<Button
							onClick={handleProceed}
							className="flex-1 bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold h-14 rounded-full text-lg shadow-[0_4px_20px_rgba(255,119,0,0.3)] transition-all"
						>
							Proceed
						</Button>
						<Button
							onClick={onClose}
							className="flex-1 bg-transparent border-2 border-[#FF7700] text-[#FF7700] hover:bg-[#FF7700]/10 font-bold h-14 rounded-full text-lg transition-all"
						>
							Cancel
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// 2. Confirm Withdrawal Modal
interface ConfirmWithdrawalModalProps extends ModalProps {
	amount: number;
	bankDetails?: PayoutAccountResponse["bankDetails"];
	isLoading: boolean;
	onConfirm: () => void;
}

export const ConfirmWithdrawalModal = ({
	isOpen,
	onClose,
	amount,
	bankDetails,
	isLoading,
	onConfirm,
}: ConfirmWithdrawalModalProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-8 rounded-[32px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-left">
						Confirm Withdrawal
					</DialogTitle>
				</DialogHeader>

				<div className="mt-8 flex flex-col gap-6">
					<div className="bg-[#1D1F20] rounded-2xl p-8 flex flex-col items-center gap-6 border border-white/5">
						<div className="flex flex-col items-center gap-2">
							<span className="text-gray-400 text-sm">Amount :-</span>
							<span className="text-3xl font-bold">
								₹{amount.toLocaleString()}
							</span>
						</div>

						{bankDetails && (
							<div className="w-full flex items-center gap-3 bg-[#25282A] p-3 rounded-xl">
								<div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-[8px] font-bold">
									HDFC
								</div>
								<div className="flex-1">
									<span className="text-sm font-medium block">
										{bankDetails.bankName}
									</span>
									<span className="text-xs text-gray-400">
										********{bankDetails.last4}
									</span>
								</div>
							</div>
						)}

						<p className="text-[#FF3B30] text-[10px] font-medium uppercase tracking-wider">
							Note :- Processing Time 24 hours
						</p>
					</div>

					<div className="flex gap-4">
						<Button
							onClick={onConfirm}
							disabled={isLoading}
							className="flex-1 bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold h-14 rounded-full text-lg shadow-[0_4px_20px_rgba(255,119,0,0.3)] transition-all"
						>
							{isLoading ? (
								<Loader2 className="w-6 h-6 animate-spin" />
							) : (
								"Confirm"
							)}
						</Button>
						<Button
							onClick={onClose}
							className="flex-1 bg-transparent border-2 border-[#FF7700] text-[#FF7700] hover:bg-[#FF7700]/10 font-bold h-14 rounded-full text-lg transition-all"
						>
							Cancel
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// 3. Success Modal
export const WithdrawalSuccessModal = ({
	isOpen,
	onClose,
	amount,
}: ModalProps & { amount: number }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-10 rounded-[40px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<div className="flex flex-col items-center text-center gap-6">
					<div className="relative w-24 h-24">
						<div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse" />
						<div className="absolute inset-2 bg-green-500 rounded-full flex items-center justify-center">
							<CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<h2 className="text-3xl font-bold">Withdrawal Successful</h2>
						<p className="text-gray-400 text-base">
							₹{amount.toLocaleString()} has been sent to your bank account
						</p>
					</div>

					<Button
						onClick={onClose}
						className="w-full bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold h-14 rounded-full text-lg mt-4"
					>
						Done
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// 4. Failed Modal
export const WithdrawalFailedModal = ({
	isOpen,
	onClose,
	reason,
	onRetry,
}: ModalProps & { reason?: string; onRetry: () => void }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-10 rounded-[40px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<div className="flex flex-col items-center text-center gap-6">
					<div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
						<AlertCircle className="w-12 h-12 text-red-500" />
					</div>

					<div className="flex flex-col gap-2">
						<h2 className="text-3xl font-bold">Withdrawal Failed</h2>
						<div className="flex flex-col gap-1">
							<span className="text-gray-500 text-xs uppercase tracking-widest font-bold">
								Reason:
							</span>
							<p className="text-gray-400 text-sm leading-relaxed">
								{reason ||
									"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc molestie libero in ex cursus vulputate."}
							</p>
						</div>
					</div>

					<div className="flex flex-col w-full gap-3 mt-4">
						<Button
							onClick={onRetry}
							className="bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold h-14 rounded-full text-lg shadow-[0_4px_20px_rgba(255,119,0,0.3)]"
						>
							Retry
						</Button>
						<Button
							variant="outline"
							className="bg-transparent border-2 border-[#FF7700] text-[#FF7700] hover:bg-[#FF7700]/10 font-bold h-14 rounded-full text-lg"
						>
							Contact Support
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// 5. Update Payment Method Modal
interface UpdateWithdrawalMethodModalProps extends ModalProps {
	bankDetails?: PayoutAccountResponse["bankDetails"];
	onUpdate: () => void;
}

export const UpdateWithdrawalMethodModal = ({
	isOpen,
	onClose,
	bankDetails,
	onUpdate,
}: UpdateWithdrawalMethodModalProps) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-8 rounded-[32px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-left">
						Update Withdrawal Method
					</DialogTitle>
					<p className="text-xs text-gray-500 text-left mt-1">
						Please enter your bank details carefully to avoid errors or delays.
					</p>
				</DialogHeader>

				<div className="mt-8 flex flex-col gap-6">
					{bankDetails ? (
						<div className="bg-[#1D1F20] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
									<div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-[10px] font-bold">
										HDFC
									</div>
								</div>
								<div className="flex flex-col">
									<span className="text-base font-bold">
										{bankDetails.bankName}
									</span>
									<span className="text-sm text-gray-400">
										********{bankDetails.last4}
									</span>
								</div>
							</div>
						</div>
					) : (
						<div className="py-10 flex items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-2xl">
							No withdrawal method added
						</div>
					)}

					<div className="flex flex-col gap-3">
						<button
							onClick={onUpdate}
							className="text-[#FF7700] font-bold text-sm underline underline-offset-4 decoration-2"
						>
							Change Bank Details
						</button>
					</div>

					<div className="flex gap-4 mt-2">
						<Button
							onClick={onClose}
							className="w-full bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold h-14 rounded-full text-lg shadow-[0_4px_20px_rgba(255,119,0,0.3)] transition-all"
						>
							Done
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// 6. Select Country Modal (Responsive)
interface SelectCountryModalProps extends ModalProps {
	onSelect: (countryCode: string) => void;
}

export const SelectCountryModal = ({
	isOpen,
	onClose,
	onSelect,
}: SelectCountryModalProps) => {
	const isMobile = useIsMobile();
	const [searchQuery, setSearchQuery] = useState("");

	const filteredCountries = countryCodes.filter(
		(c) =>
			c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			c.code.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Helper for older browsers or environments
	const safeFromCodePoint = (...codePoints: number[]) => {
		if ((String as any).fromCodePoint) {
			return (String as any).fromCodePoint(...codePoints);
		}
		return "";
	};

	const content = (
		<div className="flex flex-col h-full max-h-[80vh] md:max-h-none overflow-hidden">
			<div className="px-6 pb-4 md:px-0">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<Input
						placeholder="Search country..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="bg-[#1D1F20] border-white/5 pl-10 h-12 rounded-xl focus:ring-[#FF7700]/50 text-white"
					/>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto custom-scrollbar px-2 md:px-0 mt-2">
				<div className="grid grid-cols-1 gap-1">
					{filteredCountries.map((country) => (
						<button
							key={country.code}
							onClick={() => {
								onSelect(country.code);
								onClose();
							}}
							className="flex items-center gap-4 w-full p-4 hover:bg-white/5 rounded-xl transition-colors text-left group"
						>
							<span className="text-2xl">
								{safeFromCodePoint(
									...country.code
										.toUpperCase()
										.split("")
										.map((char) => 127397 + char.charCodeAt(0)),
								)}
							</span>
							<div className="flex flex-col flex-1">
								<span className="text-white font-medium group-hover:text-[#FF7700] transition-colors">
									{country.name}
								</span>
								<span className="text-gray-500 text-xs">{country.code}</span>
							</div>
						</button>
					))}
					{filteredCountries.length === 0 && (
						<div className="py-10 text-center text-gray-500">
							No countries found matching "{searchQuery}"
						</div>
					)}
				</div>
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<Drawer open={isOpen} onOpenChange={onClose}>
				<DrawerContent className="bg-[#161616] border-white/10 text-white p-0 rounded-t-[32px] outline-none">
					<DrawerHeader className="px-6 pt-6 text-left">
						<DrawerTitle className="text-2xl font-bold text-white">
							Select Country
						</DrawerTitle>
						<p className="text-sm text-gray-500">
							Pick your payout destination account country
						</p>
					</DrawerHeader>
					<div className="px-4 pb-8 h-[70vh]">{content}</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="bg-[#161616] border-white/10 text-white max-w-md p-8 rounded-[32px] flex flex-col h-[600px] backdrop-blur-[354px] outline-none"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold text-left">
						Select Country
					</DialogTitle>
					<p className="text-sm text-gray-500 text-left mt-1">
						Pick your payout destination account country
					</p>
				</DialogHeader>
				<div className="mt-6 flex-1 overflow-hidden">{content}</div>
			</DialogContent>
		</Dialog>
	);
};

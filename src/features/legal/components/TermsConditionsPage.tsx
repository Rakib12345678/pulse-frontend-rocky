import { ChevronLeft } from 'lucide-react';

const TermsConditionsPage = () => {
	return (
		<div className="min-h-screen text-gray-200 p-6 pb-18 md:p-12">
			<button
				onClick={() => window.history.back()}
				className="flex items-center gap-3 text-white transition-colors mb-6 cursor-pointer py-3 pr-4 pl-0 -ml-1"
			>
				<ChevronLeft className="w-7 h-7" />
				<span className="text-lg font-bold">Back</span>
			</button>
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
				<p className="text-sm text-gray-400 mb-10">Effective Date: 26th March 2026 | Last Updated: 27th March 2026</p>

				<div className="space-y-8 text-base md:text-lg leading-relaxed text-gray-300">
					<section className="space-y-4">
						<p>These Terms & Conditions ("Terms") govern access to and use of the PulseLive platform, including all related applications, websites, services, and features (collectively, the "Platform").</p>
						<p>By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
					</section>

					<section className="space-y-4">
						<h2 className="text-xl md:text-2xl font-semibold text-white">1. Eligibility</h2>
						<p>Use of the Platform is restricted to individuals who are at least 18 years of age or the age of majority in their jurisdiction. By using PulseLive, you represent and warrant that you meet these eligibility requirements.</p>
					</section>

					<section className="space-y-4">
						<h2 className="text-xl md:text-2xl font-semibold text-white">2. Account Registration and Responsibility</h2>
						<p>Users are required to create an account to access certain features of the Platform. You agree to:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Provide accurate, current, and complete information</li>
							<li>Maintain the confidentiality of your login credentials</li>
							<li>Accept responsibility for all activities conducted under your account</li>
						</ul>
						<p>The Company reserves the right to suspend or terminate accounts that provide false information or engage in unauthorised activity.</p>
					</section>

					<section className="space-y-4">
						<h2 className="text-xl md:text-2xl font-semibold text-white">3. Nature of Services</h2>
						<p>PulseLive provides a digital platform that enables:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Live streaming and audience engagement</li>
							<li>Virtual gifting through in-app currency</li>
							<li>Creator monetisation via virtual earnings</li>
						</ul>
						<p>The Platform operates a closed-loop virtual economy, as described below.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">4. Virtual Currency Framework</h2>
						<div className="space-y-6">
							<div className="space-y-3">
								<h3 className="text-lg md:text-xl font-medium text-gray-100">4.1 Coins (User Currency)</h3>
								<p>Coins are virtual items purchased using real-world currency.</p>
								<ul className="list-disc pl-6 space-y-2">
									<li>Coins are licensed, not owned</li>
									<li>Coins are non-transferable and non-refundable, except as required by applicable law</li>
									<li>Coins have no cash value outside the Platform and cannot be redeemed for money</li>
								</ul>
							</div>

							<div className="space-y-3">
								<h3 className="text-lg md:text-xl font-medium text-gray-100">4.2 Diamonds (Creator Earnings)</h3>
								<p>Diamonds represent a measure of creator earnings derived from virtual gifts.</p>
								<ul className="list-disc pl-6 space-y-2">
									<li>Diamonds are not a form of currency or stored value instrument</li>
									<li>Diamonds cannot be transferred between users</li>
									<li>Diamonds are redeemable only through the Platform's authorised payout mechanisms, subject to applicable conditions</li>
								</ul>
							</div>
						</div>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">5. Payments and Pricing</h2>
						<p>All payments on the Platform are processed through authorised third-party payment service providers.</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Pricing of Coin packages is determined by the Company and may be modified at its discretion</li>
							<li>Applicable taxes, duties, or charges may be levied depending on the jurisdiction</li>
							<li>The Company does not store sensitive payment credentials</li>
						</ul>
						<p>Users acknowledge that payment processing is subject to the terms and conditions of the respective payment providers.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">6. Virtual Gifts and Transactions</h2>
						<p>Virtual gifts may be purchased using Coins and sent to creators during live sessions.</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>All gift transactions are final and irreversible</li>
							<li>Coins used for gifting are immediately deducted and cannot be reinstated</li>
							<li>The delivery of virtual gifts is considered complete upon successful processing within the Platform</li>
						</ul>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">7. Platform Fees and Revenue Share</h2>
						<p>The Company retains a portion of the value associated with virtual gifts as a service fee. The remaining value is credited to creators in the form of Diamonds. The applicable fee structure may be modified at the Company's discretion.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">8. Creator Earnings and Withdrawals</h2>
						<p>Creators may request withdrawal of earnings subject to:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Meeting minimum payout thresholds</li>
							<li>Completion of identity verification (KYC) requirements</li>
							<li>Compliance with applicable laws and internal risk controls</li>
						</ul>
						<p>Payout timelines are indicative and may vary based on processing partners, jurisdiction, and verification status. The Company reserves the right to withhold or delay payouts in cases of suspected fraud, policy violations, or legal obligations.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">9. Prohibited Conduct</h2>
						<p>Users agree not to engage in:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Fraudulent or deceptive transactions</li>
							<li>Unauthorised payment activities or chargeback abuse</li>
							<li>Artificial inflation of engagement or gifting activity</li>
							<li>Use of automated systems or bots</li>
							<li>Any activity that violates applicable laws or regulations</li>
						</ul>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">10. Suspension and Termination</h2>
						<p>The Company reserves the right, at its sole discretion, to suspend, restrict, or terminate user accounts in cases of:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Violation of these Terms</li>
							<li>Suspicious or fraudulent activity</li>
							<li>Legal or regulatory requirements</li>
						</ul>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">11. Intellectual Property</h2>
						<p>All content, trademarks, technology, and intellectual property associated with the Platform are owned by or licensed to PulseLive. Users are granted a limited, non-exclusive, non-transferable license to access and use the Platform for its intended purposes.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">12. Disclaimer of Warranties</h2>
						<p>The Platform is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">13. Limitation of Liability</h2>
						<p>To the maximum extent permitted by law, PulseLive shall not be liable for:</p>
						<ul className="list-disc pl-6 space-y-2">
							<li>Indirect, incidental, or consequential damages</li>
							<li>Losses arising from third-party payment failures</li>
							<li>Interruptions or unavailability of the Platform</li>
						</ul>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">14. Indemnification</h2>
						<p>Users agree to indemnify and hold harmless PulseLive, its affiliates, and its personnel from any claims, damages, or liabilities arising from the misuse of the Platform or a violation of these Terms.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">15. Governing Law and Jurisdiction</h2>
						<p>These Terms shall be governed by and construed in accordance with the laws of the specific Jurisdiction. Any disputes shall be subject to the exclusive jurisdiction of the courts located in a specific Location.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8">
						<h2 className="text-xl md:text-2xl font-semibold text-white">16. Modifications to Terms</h2>
						<p>The Company reserves the right to update or modify these Terms at any time. Continued use of the Platform constitutes acceptance of the revised Terms.</p>
					</section>

					<section className="space-y-4 border-t border-white/5 pt-8 mb-36">
						<h2 className="text-xl md:text-2xl font-semibold text-white">17. Contact Information</h2>
						<p>For any queries regarding these Terms:</p>
						<ul className="list-none space-y-2">
							<li><span className="text-gray-400">Email:</span> support@pulselive.com</li>
							<li><span className="text-gray-400">Registered Address:</span> [Insert Company Address]</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	);
};

export default TermsConditionsPage;
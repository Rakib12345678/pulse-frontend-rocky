

const RefundPolicyPage = () => {
    return (
        <div className="p-6 pb-24 h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-gray-200">
            <div className="max-w-4xl mx-auto bg-[#111213] p-8 rounded-2xl border border-white/10 shadow-xl space-y-6 h-fit w-full">
                <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
                <p className="text-sm text-gray-400 mb-6">Effective Date: 26th March 2026<br />Last Updated: 27th March 2026</p>

                <div className="space-y-4 text-sm leading-relaxed">
                    <p>This Refund Policy governs all purchases and transactions conducted on the PulseLive platform.</p>
                    <p>By making a purchase, you agree to the terms outlined in this Policy.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">1. General Principle</h2>
                    <p>PulseLive operates a digital virtual currency system. All purchases of Coins and subsequent use of Coins for virtual goods are considered final and non-reversible, except as expressly stated in this Policy or required under applicable law.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">2. Coin Purchases</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Coins are digital items that are delivered instantly upon successful payment</li>
                        <li>Once credited to a user’s account, Coin purchases are non-refundable and non-exchangeable</li>
                        <li>Coins cannot be redeemed for cash or transferred to another user</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">3. Use of Coins</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Coins used to purchase virtual gifts are consumed immediately upon transaction</li>
                        <li>All such transactions are final and irrevocable</li>
                        <li>No refunds, reversals, or credits will be issued for completed gift transactions</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">4. Failed or Erroneous Transactions</h2>
                    <p>In the event of a technical issue, including:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Payment charged, but Coins not credited</li>
                        <li>Duplicate or incorrect charges</li>
                    </ul>
                    <p>Users must notify support within a reasonable timeframe. Upon verification, PulseLive may, at its sole discretion:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Credit the appropriate number of Coins to the user account, or</li>
                        <li>Initiate a refund to the original payment method</li>
                    </ul>
                    <p>Resolution timelines may vary, but are typically processed within 5–7 business days.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">5. Unauthorised Transactions</h2>
                    <p>Users are responsible for maintaining the security of their accounts.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Any unauthorised transaction must be reported within 48 hours</li>
                        <li>All such claims are subject to investigation</li>
                        <li>Refunds are not guaranteed and will be assessed on a case-by-case basis</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">6. Chargebacks and Payment Disputes</h2>
                    <p>Initiating a chargeback or dispute through a payment provider without first contacting PulseLive may result in:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Immediate account suspension or restriction</li>
                        <li>Reversal of wallet balances</li>
                        <li>Investigation for potential misuse</li>
                    </ul>
                    <p>PulseLive reserves the right to contest chargebacks and provide evidence of transaction validity.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">7. Fraud Prevention</h2>
                    <p>PulseLive actively monitors transactions for suspicious or fraudulent behaviour. The Company reserves the right to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Block or reverse transactions</li>
                        <li>Restrict account activity</li>
                        <li>Withhold services or payouts</li>
                    </ul>
                    <p>where fraud or abuse is suspected.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">8. Exceptional Circumstances</h2>
                    <p>Refunds may be granted solely at the Company’s discretion in exceptional situations, including:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>System-wide technical failures</li>
                        <li>Verified billing errors</li>
                    </ul>
                    <p>Such decisions are final and not subject to further appeal.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">9. Compliance with Payment Providers</h2>
                    <p>This Policy is designed in alignment with the requirements of third-party payment processors and card networks. Users acknowledge that additional terms may apply as per their payment provider.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">10. Contact Support</h2>
                    <p>For refund-related inquiries:</p>
                    <ul className="list-disc pl-5 space-y-20">
                        <li>Email: support@pulselive.com</li>
                        <li>Support Hours: [Insert Support Details]</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;
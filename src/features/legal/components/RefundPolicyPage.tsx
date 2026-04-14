

const RefundPolicyPage = () => {
    return (
        <div className="min-h-screen text-gray-200 p-6 pb-24 md:p-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Refund Policy</h1>
                <p className="text-sm text-gray-400 mb-10">Effective Date: 26th March 2026 | Last Updated: 27th March 2026</p>

                <div className="space-y-8 text-base md:text-lg leading-relaxed text-gray-300">
                    <section className="space-y-4">
                        <p>This Refund Policy governs all purchases and transactions conducted on the PulseLive platform.</p>
                        <p>By making a purchase, you agree to the terms outlined in this Policy.</p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">1. General Principle</h2>
                        <p>PulseLive operates a digital virtual currency system. All purchases of Coins and subsequent use of Coins for virtual goods are considered final and non-reversible, except as expressly stated in this Policy or required under applicable law.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">2. Coin Purchases</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Coins are digital items that are delivered instantly upon successful payment</li>
                            <li>Once credited to a user’s account, Coin purchases are non-refundable and non-exchangeable</li>
                            <li>Coins cannot be redeemed for cash or transferred to another user</li>
                        </ul>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">3. Use of Coins</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Coins used to purchase virtual gifts are consumed immediately upon transaction</li>
                            <li>All such transactions are final and irrevocable</li>
                            <li>No refunds, reversals, or credits will be issued for completed gift transactions</li>
                        </ul>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">4. Failed or Erroneous Transactions</h2>
                        <p>In the event of a technical issue, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Payment charged, but Coins not credited</li>
                            <li>Duplicate or incorrect charges</li>
                        </ul>
                        <p>Users must notify support within a reasonable timeframe. Upon verification, PulseLive may, at its sole discretion:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Credit the appropriate number of Coins to the user account, or</li>
                            <li>Initiate a refund to the original payment method</li>
                        </ul>
                        <p>Resolution timelines may vary, but are typically processed within 5–7 business days.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">5. Unauthorised Transactions</h2>
                        <p>Users are responsible for maintaining the security of their accounts.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Any unauthorised transaction must be reported within 48 hours</li>
                            <li>All such claims are subject to investigation</li>
                            <li>Refunds are not guaranteed and will be assessed on a case-by-case basis</li>
                        </ul>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">6. Chargebacks and Payment Disputes</h2>
                        <p>Initiating a chargeback or dispute through a payment provider without first contacting PulseLive may result in:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Immediate account suspension or restriction</li>
                            <li>Reversal of wallet balances</li>
                            <li>Investigation for potential misuse</li>
                        </ul>
                        <p>PulseLive reserves the right to contest chargebacks and provide evidence of transaction validity.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">7. Fraud Prevention</h2>
                        <p>PulseLive actively monitors transactions for suspicious or fraudulent behaviour. The Company reserves the right to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Block or reverse transactions</li>
                            <li>Restrict account activity</li>
                            <li>Withhold services or payouts</li>
                        </ul>
                        <p>where fraud or abuse is suspected.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">8. Exceptional Circumstances</h2>
                        <p>Refunds may be granted solely at the Company’s discretion in exceptional situations, including:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>System-wide technical failures</li>
                            <li>Verified billing errors</li>
                        </ul>
                        <p>Such decisions are final and not subject to further appeal.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">9. Compliance with Payment Providers</h2>
                        <p>This Policy is designed in alignment with the requirements of third-party payment processors and card networks. Users acknowledge that additional terms may apply as per their payment provider.</p>
                    </section>

                    <section className="space-y-4 border-t border-white/5 pt-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-white">10. Contact Support</h2>
                        <p>For refund-related inquiries:</p>
                        <ul className="list-none space-y-2">
                            <li><span className="text-gray-400">Email:</span> support@pulselive.com</li>
                            <li><span className="text-gray-400">Support Hours:</span> [Insert Support Details]</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;
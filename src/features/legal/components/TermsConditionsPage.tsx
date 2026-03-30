

const TermsConditionsPage = () => {
    return (
        <div className="p-6 pb-24 h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-gray-200">
            <div className="max-w-4xl mx-auto bg-[#111213] p-8 rounded-2xl border border-white/10 shadow-xl space-y-6 h-fit w-full">
                <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
                <p className="text-sm text-gray-400 mb-6">Effective Date: 26th March 2026<br />Last Updated: 27th March 2026</p>

                <div className="space-y-4 text-sm leading-relaxed">
                    <p>These Terms & Conditions (“Terms”) govern access to and use of the PulseLive platform, including all related applications, websites, services, and features (collectively, the “Platform”).</p>
                    <p>By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">1. Eligibility</h2>
                    <p>Use of the Platform is restricted to individuals who are at least 18 years of age or the age of majority in their jurisdiction. By using PulseLive, you represent and warrant that you meet these eligibility requirements.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">2. Account Registration and Responsibility</h2>
                    <p>Users are required to create an account to access certain features of the Platform. You agree to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Provide accurate, current, and complete information</li>
                        <li>Maintain the confidentiality of your login credentials</li>
                        <li>Accept responsibility for all activities conducted under your account</li>
                    </ul>
                    <p>The Company reserves the right to suspend or terminate accounts that provide false information or engage in unauthorised activity.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">3. Nature of Services</h2>
                    <p>PulseLive provides a digital platform that enables:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Live streaming and audience engagement</li>
                        <li>Virtual gifting through in-app currency</li>
                        <li>Creator monetisation via virtual earnings</li>
                    </ul>
                    <p>The Platform operates a closed-loop virtual economy, as described below.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">4. Virtual Currency Framework</h2>
                    <h3 className="text-lg font-medium text-gray-100 mt-4">4.1 Coins (User Currency)</h3>
                    <p>Coins are virtual items purchased using real-world currency.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Coins are licensed, not owned</li>
                        <li>Coins are non-transferable and non-refundable, except as required by applicable law</li>
                        <li>Coins have no cash value outside the Platform and cannot be redeemed for money</li>
                    </ul>

                    <h3 className="text-lg font-medium text-gray-100 mt-4">4.2 Diamonds (Creator Earnings)</h3>
                    <p>Diamonds represent a measure of creator earnings derived from virtual gifts.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Diamonds are not a form of currency or stored value instrument</li>
                        <li>Diamonds cannot be transferred between users</li>
                        <li>Diamonds are redeemable only through the Platform’s authorised payout mechanisms, subject to applicable conditions</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">5. Payments and Pricing</h2>
                    <p>All payments on the Platform are processed through authorised third-party payment service providers.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Pricing of Coin packages is determined by the Company and may be modified at its discretion</li>
                        <li>Applicable taxes, duties, or charges may be levied depending on the jurisdiction</li>
                        <li>The Company does not store sensitive payment credentials</li>
                    </ul>
                    <p>Users acknowledge that payment processing is subject to the terms and conditions of the respective payment providers.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">6. Virtual Gifts and Transactions</h2>
                    <p>Virtual gifts may be purchased using Coins and sent to creators during live sessions.</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>All gift transactions are final and irreversible</li>
                        <li>Coins used for gifting are immediately deducted and cannot be reinstated</li>
                        <li>The delivery of virtual gifts is considered complete upon successful processing within the Platform</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">7. Platform Fees and Revenue Share</h2>
                    <p>The Company retains a portion of the value associated with virtual gifts as a service fee. The remaining value is credited to creators in the form of Diamonds. The applicable fee structure may be modified at the Company’s discretion.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">8. Creator Earnings and Withdrawals</h2>
                    <p>Creators may request withdrawal of earnings subject to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Meeting minimum payout thresholds</li>
                        <li>Completion of identity verification (KYC) requirements</li>
                        <li>Compliance with applicable laws and internal risk controls</li>
                    </ul>
                    <p>Payout timelines are indicative and may vary based on processing partners, jurisdiction, and verification status. The Company reserves the right to withhold or delay payouts in cases of suspected fraud, policy violations, or legal obligations.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">9. Prohibited Conduct</h2>
                    <p>Users agree not to engage in:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Fraudulent or deceptive transactions</li>
                        <li>Unauthorised payment activities or chargeback abuse</li>
                        <li>Artificial inflation of engagement or gifting activity</li>
                        <li>Use of automated systems or bots</li>
                        <li>Any activity that violates applicable laws or regulations</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">10. Suspension and Termination</h2>
                    <p>The Company reserves the right, at its sole discretion, to suspend, restrict, or terminate user accounts in cases of:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Violation of these Terms</li>
                        <li>Suspicious or fraudulent activity</li>
                        <li>Legal or regulatory requirements</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">11. Intellectual Property</h2>
                    <p>All content, trademarks, technology, and intellectual property associated with the Platform are owned by or licensed to PulseLive. Users are granted a limited, non-exclusive, non-transferable license to access and use the Platform for its intended purposes.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">12. Disclaimer of Warranties</h2>
                    <p>The Platform is provided on an “as is” and “as available” basis without warranties of any kind, whether express or implied.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">13. Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, PulseLive shall not be liable for:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Indirect, incidental, or consequential damages</li>
                        <li>Losses arising from third-party payment failures</li>
                        <li>Interruptions or unavailability of the Platform</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-white mt-6">14. Indemnification</h2>
                    <p>Users agree to indemnify and hold harmless PulseLive, its affiliates, and its personnel from any claims, damages, or liabilities arising from the misuse of the Platform or a violation of these Terms.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">15. Governing Law and Jurisdiction</h2>
                    <p>These Terms shall be governed by and construed in accordance with the laws of the specific Jurisdiction. Any disputes shall be subject to the exclusive jurisdiction of the courts located in a specific Location.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">16. Modifications to Terms</h2>
                    <p>The Company reserves the right to update or modify these Terms at any time. Continued use of the Platform constitutes acceptance of the revised Terms.</p>

                    <h2 className="text-xl font-semibold text-white mt-6">17. Contact Information</h2>
                    <p>For any queries regarding these Terms:</p>
                    <ul className="list-disc pl-5 space-y-5">
                        <li>Email: support@pulselive.com</li>
                        <li>Registered Address: [Insert Company Address]</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TermsConditionsPage;
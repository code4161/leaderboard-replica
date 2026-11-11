// The thirteen numbered sections, in order. One of them carries an emphasised phrase in the middle of its paragraph.
export type TermsSection = { title: string; body: string; strong?: string; after?: string };

export const SECTIONS: TermsSection[] = [
  { title: "1. Acceptance of Terms", body: "By accessing or using Predicting.top (\"the Site\"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Site." },
  { title: "2. Informational Purposes Only", body: "The Site displays publicly available trading data and statistics from prediction markets. All information is provided for ", strong: "informational and entertainment purposes only", after: ". The Site does not provide financial, investment, legal, or tax advice." },
  { title: "3. No Financial Advice", body: "Nothing on this Site constitutes a recommendation to buy, sell, or hold any financial instrument or to engage in any trading strategy. Past performance of any trader shown on the Site is not indicative of future results. You should consult a qualified financial advisor before making any investment decisions." },
  { title: "4. No Warranty", body: "The Site is provided \"as is\" without warranties of any kind, either express or implied. We do not guarantee the accuracy, completeness, reliability, or timeliness of any data displayed. Trading data may be delayed, incomplete, or contain errors. We make no representations about the suitability of this information for any purpose." },
  { title: "5. Limitation of Liability", body: "To the fullest extent permitted by law, Predicting.top and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Site, reliance on any information provided, or any trading decisions you make. This includes, but is not limited to, loss of profits, data, or other intangible losses." },
  { title: "6. Third-Party Links", body: "The Site contains links to third-party websites, including but not limited to Polymarket and Kalshi. We are not responsible for the content, terms, privacy practices, or actions of these third-party sites. Your use of third-party platforms is at your own risk and subject to their respective terms of service." },
  { title: "7. Assumption of Risk", body: "Prediction markets involve significant risk of loss. You acknowledge that trading on prediction markets can result in the loss of your entire investment. You assume full responsibility for any trading decisions you make and any resulting gains or losses." },
  { title: "8. User Conduct", body: "You agree not to: (a) use the Site for any unlawful purpose; (b) attempt to interfere with the Site's operation; (c) scrape or collect data in a manner that overburdens our systems; (d) misrepresent your affiliation with any person or entity." },
  { title: "9. Intellectual Property", body: "The Site's design, code, and original content are protected by intellectual property laws. Trader data displayed is sourced from public blockchain records and third-party APIs." },
  { title: "10. Indemnification", body: "You agree to indemnify and hold harmless Predicting.top and its operators from any claims, damages, losses, or expenses arising from your use of the Site or violation of these Terms." },
  { title: "11. Modifications", body: "We reserve the right to modify these Terms at any time. Continued use of the Site after changes constitutes acceptance of the updated Terms." },
  { title: "12. Governing Law", body: "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles." },
  { title: "13. Severability", body: "If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect." },
];

export const CLOSING =
  "By using Predicting.top, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.";

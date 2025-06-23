import React from 'react';
import Navbar from '../components/Navbar'; // ✅ Make sure this is imported

const Pricing = () => (
  <>
    <Navbar /> {/* ✅ Inserted at the top */}
    <div className="bg-black min-h-screen py-16 px-4 text-white text-center">
      <h1 className="text-3xl font-bold mb-10">Choose Your Plan</h1>
      <div className="flex flex-wrap justify-center gap-8">
        {/* Free Plan */}
        <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">Free</h2>
            <p className="text-center text-3xl font-semibold mb-2">$0 <span className="text-sm">/mo</span></p>
            <ul className="text-left space-y-2 mt-4">
              <li className="text-green-400">✓ Basic AI document drafting</li>
              <li className="text-green-400">✓ 1 document per month</li>
              <li className="text-green-400">✓ Access to limited case types</li>
              <li className="text-green-400">✓ No file upload</li>
              <li className="text-green-400">✓ Email-only support</li>
            </ul>
          </div>
          <button className="mt-6 bg-indigo-500 text-white py-2 rounded-full">Select</button>
        </div>

        {/* Plus Plan */}
        <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">Plus</h2>
            <p className="text-center text-3xl font-semibold mb-2">$15 <span className="text-sm">/mo</span></p>
            <ul className="text-left space-y-2 mt-4">
              <li className="text-green-400">✓ Everything in Free</li>
              <li className="text-green-400">✓ Upload scanned files, images, PDFs</li>
              <li className="text-green-400">✓ AI analysis of uploads with case matching</li>
              <li className="text-green-400">✓ Document storage and dashboard access</li>
              <li className="text-green-400">✓ Faster processing speed</li>
              <li className="text-green-400">✓ Email + Chat support</li>
            </ul>
          </div>
          <button className="mt-6 bg-indigo-500 text-white py-2 rounded-full">Select</button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gray-800 text-white rounded-xl p-6 w-full max-w-xs flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-2xl font-bold text-center mb-2">Pro</h2>
            <p className="text-center text-3xl font-semibold mb-2">$49 <span className="text-sm">/mo</span></p>
            <ul className="text-left space-y-2 mt-4">
              <li className="text-green-400">✓ Everything in Plus</li>
              <li className="text-green-400">✓ Live trial prep suggestions</li>
              <li className="text-green-400">✓ Voice-to-text transcription</li>
              <li className="text-green-400">✓ AI-generated outlines and arguments</li>
              <li className="text-green-400">✓ Multiple follow-up questions per document</li>
              <li className="text-green-400">✓ Priority AI access and dedicated support</li>
            </ul>
          </div>
          <button className="mt-6 bg-indigo-500 text-white py-2 rounded-full">Select</button>
        </div>
      </div>
    </div>
  </>
);

export default Pricing;

import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-black to-gray-900 text-white">
      {/* Header */}
      <header className="px-6 py-6 flex justify-between items-center bg-black bg-opacity-70">
        <h1 className="text-2xl font-bold text-yellow-400">⚖️ JusticePath</h1>
        <nav className="space-x-6">
          <Link to="/login" className="hover:underline">Sign In</Link>
          <Link to="/select-plan" className="hover:underline">Plans</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="text-center py-24 px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Accessible Legal Help for Everyone</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          Get legal guidance, generate documents, and prepare for court — all with AI-powered assistance designed for self-represented individuals.
        </p>
        <Link
          to="/case-type-selection"
          className="inline-block bg-yellow-500 text-black font-semibold px-6 py-3 rounded hover:bg-yellow-600 transition"
        >
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-16 max-w-7xl mx-auto">
        {[
          {
            title: 'AI Legal Assistant',
            description: 'Ask legal questions and get plain-English explanations with instant AI help.',
            icon: '💬',
          },
          {
            title: 'Smart Document Builder',
            description: 'Build court-ready legal forms tailored to your situation in minutes.',
            icon: '📄',
          },
          {
            title: 'Guided Case Support',
            description: 'Step-by-step walkthroughs for eviction, small claims, and family law cases.',
            icon: '🧭',
          },
          {
            title: 'Your Privacy Matters',
            description: 'Your data stays secure. No law firm access. Full control in your hands.',
            icon: '🔒',
          },
        ].map(({ title, description, icon }) => (
          <div key={title} className="bg-gray-800 p-6 rounded-xl text-center shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-yellow-400">{title}</h3>
            <p className="text-sm text-gray-300">{description}</p>
          </div>
        ))}
      </section>

      {/* Coming Soon Features */}
      <section className="bg-gray-900 py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-white">What’s Coming Next</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: 'Legal Chatbot for Courtrooms',
              desc: 'Real-time responses in court prep scenarios with AI.',
              icon: '🧠',
            },
            {
              title: 'Case Matching',
              desc: 'Automatically classify your case and suggest motion templates.',
              icon: '📂',
            },
            {
              title: 'Local Court Lookup',
              desc: 'Auto-fill forms and info based on your court jurisdiction.',
              icon: '🗺️',
            },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="bg-gray-800 p-6 rounded-xl text-center shadow">
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-1">{title}</h3>
              <p className="text-gray-300 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-black">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">What Users Are Saying</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              quote: "JusticePath gave me the tools to fight back when I couldn't afford a lawyer.",
              name: 'Maria G.',
            },
            {
              quote: "I filed an eviction response in 20 minutes. The AI help was accurate and easy to follow.",
              name: 'Tyrone L.',
            },
            {
              quote: "Best self-help legal site I’ve used. Clean, fast, and incredibly helpful.",
              name: 'Akilah W.',
            },
          ].map(({ quote, name }) => (
            <div key={name} className="bg-gray-800 p-6 rounded-xl shadow-md">
              <p className="italic text-gray-300">“{quote}”</p>
              <p className="mt-4 text-sm text-yellow-500 font-semibold">— {name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-900 py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-white">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6 text-gray-300 text-sm">
          <div>
            <h4 className="text-yellow-400 font-semibold">Is this a law firm?</h4>
            <p>No. JusticePath is a tool that provides AI-driven legal guidance, not legal representation.</p>
          </div>
          <div>
            <h4 className="text-yellow-400 font-semibold">Can I use this in court?</h4>
            <p>Yes. The documents generated are based on court standards in your jurisdiction, but always review before filing.</p>
          </div>
          <div>
            <h4 className="text-yellow-400 font-semibold">Is my data safe?</h4>
            <p>Yes. We do not sell your data, and your case information is never shared with third parties.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} JusticePath, Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
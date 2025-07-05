import React, { useCallback, useEffect } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import type { Engine } from 'tsparticles-engine';
import { motion } from 'framer-motion';
import WaterAnimation from '../components/WaterAnimations';


const testimonials = [
  {
    quote: "JusticePath made it easy to file my eviction response — without a lawyer!",
    name: "Tamika H.",
  },
  {
    quote: "I created a small claims filing in under 10 minutes. This tool is a lifesaver!",
    name: "Jose R.",
  },
  {
    quote: "Legal help that doesn’t cost thousands. Finally!",
    name: "Malik W.",
  },
];

const Home = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    console.log('TSParticles Init');
    await loadFull(engine);
  }, []);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    console.log("Canvas Found?", !!canvas);
  }, []);

  return (
    <>
      <div className="absolute inset-0 h-full w-full z-[-1]">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            background: { color: "#000" },
            fpsLimit: 60,
            particles: {
              number: { value: 50 },
              size: { value: 3 },
            },
          }}
        />
      </div>

      {/* Water Ripple Animation Overlay (layered over particles, under content) */}
      <div className="absolute inset-0 z-[0] flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-blue-400/40 rounded-full animate-ripple"></div>
      <WaterAnimation />
      </div>
      

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 py-20">

        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Accessible Legal Help for Everyone
        </motion.h1>

        <p className="text-lg md:text-xl max-w-2xl mb-10">
          Get legal guidance, generate documents, and prepare for court — all with AI-powered assistance designed for self-represented individuals.
        </p>

        <motion.a
          href="/select-plan"
          className="bg-yellow-500 text-black px-6 py-3 rounded-full text-lg font-bold hover:bg-yellow-400 transition"
          whileHover={{ scale: 1.05 }}
        >
          Get Started
        </motion.a>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-6xl">
          {["AI Legal Assistant", "Smart Document Builder", "Guided Case Support", "Your Privacy Matters"].map((title, i) => (
            <motion.div
              key={i}
              className="bg-zinc-800 rounded-xl p-6 shadow-md text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-2 text-yellow-300">{title}</h3>
              <p className="text-sm text-gray-300">
                {i === 0 && "Ask legal questions and get plain-English answers with instant AI help."}
                {i === 1 && "Build court-ready legal forms tailored to your situation in minutes."}
                {i === 2 && "Step-by-step walkthroughs for evictions, small claims, and more."}
                {i === 3 && "Your data stays private. No law firm access. You stay in control."}
              </p>
            </motion.div>
          ))}
        </section>

        <section className="mt-24 w-full max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">What People Are Saying</h2>
          <div className="flex flex-col md:flex-row gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="bg-zinc-700 p-6 rounded-lg shadow-md flex-1"
                whileHover={{ scale: 1.03 }}
              >
                <p className="italic">"{t.quote}"</p>
                <p className="mt-4 text-right font-semibold">- {t.name}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;

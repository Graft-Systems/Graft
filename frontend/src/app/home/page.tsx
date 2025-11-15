"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-800">
      {/* HERO — PARALLAX */}
      <section className="relative h-[95vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url('/images/hero-cellar.jpg')`,
          }}
        />

        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col justify-center items-center text-center h-full px-6 text-white">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-6xl font-bold mb-6"
          >
            AI-Powered Wine Distribution
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-xl max-w-2xl mb-10"
          >
            A modern distributor with dashboards that show exact store placements, 
            predict reorders, and open the next best doors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.7 }}
            className="flex space-x-5"
          >
            <button className="px-8 py-3 bg-rose-800 text-white rounded-lg text-lg shadow-lg hover:bg-rose-700 transition">
              Learn More
            </button>
            <button className="px-8 py-3 border border-white text-white rounded-lg text-lg shadow-lg hover:bg-white hover:text-rose-800 transition">
              Request Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 — THE PROBLEM */}
      <ParallaxSection
        title="The Problem"
        text="
Retailers face guesswork. Producers lack visibility. 
Traditional distributors hide where bottles land, can't predict reorders, 
and treat data as an afterthought."
        image="/images/grapes.jpg"
      />

      {/* SECTION 2 — PRODUCER VALUE */}
      <TextSection
        title="For Producers"
        bullets={[
          "Live placement map with last sale + stock estimate.",
          "Reorder predictions for confident allocations.",
          "Look-alike targeting to open the next 5–10 doors.",
          "Measured promotions with clear lift readouts.",
          "Door-level placement report within 24 hours of delivery.",
        ]}
        highlight="We show you where every bottle lands — and when it will reorder."
      />

      {/* SECTION 3 — RETAILER VALUE */}
      <ParallaxSection
        title="For Retailers"
        text="
Approve a pre-filled weekly order in minutes. 
Cut stockouts, free cash from slow movers, and price confidently 
using neighborhood-specific insights."
        image="/images/wine-store.jpg"
      />

      {/* SECTION 4 — RETAILER BENEFITS */}
      <TextSection
        title="Retailer Benefits"
        bullets={[
          "Pre-filled weekly order with one-line “why”.",
          "Inventory and price guidance by neighborhood.",
          "Competitor carry awareness.",
          "Fewer emergencies and fewer stockouts.",
          "30–40% fewer days of inventory on test items.",
        ]}
        highlight="Become the unique shop in your neighborhood — not a copy."
      />

      {/* SECTION 5 — HOW THE AI WORKS */}
      <ParallaxSection
        title="How Our AI Works"
        text="
We combine POS data, delivery data, demographics, promotions,
and price history to forecast demand, optimize inventory,
and reveal the next best store to open."
        image="/images/producers.jpg"
      />

      {/* FOOTER */}
      <footer className="w-full text-center py-6 border-t border-gray-200 text-gray-500 text-sm mt-12">
        © {new Date().getFullYear()} Graft Systems — All rights reserved.
      </footer>
    </main>
  );
}

/* --------------------------------------- */
/* REUSABLE COMPONENTS                     */
/* --------------------------------------- */

function ParallaxSection({
  title,
  text,
  image,
}: {
  title: string;
  text: string;
  image: string;
}) {
  return (
    <section className="relative h-[70vh] w-full my-16 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white px-6">
        <motion.h3
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold mb-4"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-2xl text-lg"
        >
          {text}
        </motion.p>
      </div>
    </section>
  );
}

function TextSection({
  title,
  bullets,
  highlight,
}: {
  title: string;
  bullets: string[];
  highlight?: string;
}) {
  return (
    <section className="px-8 py-20 max-w-4xl mx-auto text-center">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-rose-900 mb-6"
      >
        {title}
      </motion.h3>

      <motion.ul
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-lg text-gray-700 space-y-3 mb-10"
      >
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </motion.ul>

      {highlight && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="text-xl font-semibold text-rose-800"
        >
          {highlight}
        </motion.p>
      )}
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="min-h-screen w-full bg-neutral-50 text-neutral-900 p-10 flex flex-col gap-24">

            {/* Our Story */}
            <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl font-bold mb-6">Our Story</h1>
                    <p className="text-lg leading-relaxed text-neutral-700">
                        Graft was founded by University of Michigan students with a passion for technology, hospitality,
                        and the craft behind the world’s greatest wines. What started as a conversation during a
                        late-night student-run dinner became a mission: create an intelligent companion that
                        empowers producers, enthusiasts, and professionals. Graft blends modern AI with centuries-old
                        winemaking tradition—enhancing connection rather than replacing it.
                    </p>
                </motion.div>

                {/* FULL IMAGE — NOT CROPPED */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full relative rounded-2xl overflow-hidden shadow-md bg-white p-4 flex items-center justify-center"
                >
                    <div className="relative w-full h-80">
                        <Image
                            src="/images/producers.jpg"
                            alt="Our Story"
                            fill
                            className="rounded-xl"
                        />
                    </div>
                </motion.div>
            </section>

            {/* Team Section */}
            <section className="max-w-5xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold mb-12 text-center"
                >
                    Meet the Team
                </motion.h2>

                <div className="flex flex-col gap-16">

                    {[
                        {
                            name: "Benson Klein",
                            img: "/images/benson.jpg",
                            desc: "Benson is a Junior at the University of Michigan from Los Angeles, California, majoring in Economics and minoring in Art History. This past summer, he worked for Les Belles Perdrix at Château Troplong-Mondot in Saint-Émilion, Nouvelle-Aquitaine, France. This upcoming summer, Benson will join Moelis & Co. in New York as an Investment Banking Summer Analyst. Benson also works with the Nantucket Wine Festival every May as a member of the Culinary Team. On Michigan’s Campus, Benson is involved with Alpha Kappa Psi Professional Business Fraternity, Michigan Stocks and Bonds Organization, Wolverine Capital Investments, and the Side Door Pop-up Restaurant."
                        },
                        {
                            name: "Jacob Tkaczyk",
                            img: "/images/jacob.jpg",
                            desc: "Jacob (JT) is a Senior at the University of Michigan from Chesterfield Township, Michigan, majoring in Computer Engineering. He brings software development experience from two internships at General Dynamics Land Systems, where he contributed to production-grade software used in real defense applications. JT serves as Secretary for the Chesterfield Township Zoning Board of Appeals, gaining exposure to municipal decision-making and public-facing problem solving. On campus, he leads a development team at Michigan Build and Launch, where he has worked on projects ranging from an AI-powered lifestyle recommendation platform to a modular algorithmic trading system. He also volunteers as a lead developer for ROTC, building a large-scale Wargame simulation that supports real-time strategy and training scenarios."
                        },
                        {
                            name: "Ben Chin",
                            img: "/images/ben.jpg",
                            desc: "Ben is a Junior at the University of Michigan from Denver, Colorado, majoring in Business Administration. This past summer, he interned at ArrowMark Partners as an Equity Investments Analyst. Next summer, he will be interning at RBC San Francisco as a summer analyst in the Technology Group. On Michigan’s campus, Benjamin is also involved with the Club Golf Team, Wolverine Capital Investments, and Zelle Early Stage Fund."
                        },
                        {
                            name: "Allen Zhang",
                            img: "/images/allen.jpg",
                            desc: "Allen is a Junior at the University of Michigan from Saint Clair, Michigan, majoring in Computer Engineering. This past summer, he interned at Amazon as a Software Development Engineer Intern and will return next summer. He’s strongest in C++ and systems-style problem-solving, with experience ranging from backend development and algorithm optimization to building interactive graphics projects in three.js. He’s worked on projects like LifeSwitch, a lifestyle-change web platform, as well as research-driven engineering work through UROP at university. In his spare time, he has helped managing his family’s resturant."
                        },
                        {
                            name: "Jordan Li",
                            img: "/images/jordan.jpg",
                            desc: "Jordan is a Junior at the University of Michigan from McComb, Michigan, majoring in Computer Science."
                        }
                    ].map((p, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-white p-8 rounded-2xl shadow-md"
                        >
                            {/* FULL IMAGE — NOT CROPPED */}
                            {/* <div className="relative w-full bg-white p-3 rounded-xl flex items-center justify-center border-none">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={p.img}
                                        alt={p.name}
                                        fill
                                        className="object-contain rounded-lg"
                                    />
                                </div>
                            </div> */}

                            <div className="md:col-span-3">
                                <h3 className="text-2xl font-semibold mb-3">{p.name}</h3>
                                <p className="text-neutral-700 leading-relaxed text-lg">{p.desc}</p>
                            </div>
                        </motion.div>
                    ))}

                </div>
            </section>

            {/* Name Section */}
            <section className="max-w-5xl mx-auto pb-24 grid grid-cols-1 md:grid-cols-1 gap-14 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl font-bold mb-6 text-center">Where Did the Name Deni Come From?</h2>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="w-full relative rounded-2xl overflow-hidden shadow-md bg-white p-4 flex items-center justify-center"
                    >
                        <div className="relative w-full h-80">
                            <Image
                                src="/images/denis.jpg"
                                alt="Denis Toner"
                                fill
                                className="rounded-xl"
                            />
                        </div>
                    </motion.div>
                    <p className="text-lg leading-relaxed text-neutral-700">
                        Denis Toner (Deni) is the Founder of the Nantucket Wine & Food Festival and a legendary sage in the wine trade. He began this adventure while living on Nantucket and working in the wine industry as a sommelier for the Chanticleer Restaurant. Today, Denis and his wife, Susan, reside in Beaune, Burgundy, France. He remains an ambassador to the Nantucket Wine & Food Festival and has paved the way for greater recognition and love for many Burgundy Vignerons.

                        His passion and knowledge for wine have affected countless individuals on their journeys in the industry, whether they are in the wine business, are collectors, or otherwise.
                    </p>
                </motion.div>
            </section>
        </div>
    );
}

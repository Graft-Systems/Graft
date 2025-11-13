import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-white text-gray-800">
      {/* Navbar */}
      <nav className="w-full flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-rose-800">Graft Systems</h1>
        <div className="flex space-x-4">
          <Link
            href="home/login"
            className="px-4 py-2 rounded-lg border border-rose-800 text-rose-800 hover:bg-rose-800 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="home/register"
            className="px-4 py-2 rounded-lg bg-rose-800 text-white hover:bg-rose-700 transition"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h2 className="text-5xl font-extrabold text-rose-900 mb-6">
          Intelligent Wine Distribution
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-10">
          Graft combines decades of wine distribution expertise with cutting-edge
          AI insights and logistics software — empowering distributors and
          producers to make smarter, faster decisions.
        </p>
        <div className="flex space-x-4">
          <button className="px-6 py-3 bg-rose-800 text-white rounded-lg hover:bg-rose-700 transition">
            Learn More
          </button>
          <button className="px-6 py-3 border border-rose-800 text-rose-800 rounded-lg hover:bg-rose-800 hover:text-white transition">
            Request Demo
          </button>
        </div>
      </section>

      <footer className="w-full text-center py-6 border-t border-gray-200 text-gray-500 text-sm">
        © {new Date().getFullYear()} Graft Systems — All rights reserved.
      </footer>
    </main>
  );
}

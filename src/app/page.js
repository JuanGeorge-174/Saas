import Navbar from "@/section/Navbar";
import Hero from "@/section/Hero";
import Features from "@/section/Features";
import Price from "@/section/Price";
import Contact from "@/section/Contact";


export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Price />
      <Contact />

    </main>
  );
}

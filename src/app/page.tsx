import { LoginForm } from "@/components/component/login-form";
import { Cross, PackageCheck, ShieldCheck, Truck } from "lucide-react";

export default function Home() {
  return (
    <main className="login-page">
      <section className="login-story" aria-label="MediShield workspace">
        <div className="brand">
          <span className="brand-mark"><Cross size={23} aria-hidden="true" /></span>
          <span className="brand-name">MediShield<span className="block mt-1 text-[10px] font-medium tracking-[0.2em] text-[#c7d7b5]">ADMIN WORKSPACE</span></span>
        </div>
        <div className="login-story-copy">
          <div className="eyebrow">Behind every better smile.</div>
          <h1>Better care starts<br />with <span>better control.</span></h1>
          <p>Your products, orders, and people. Thoughtfully connected in one place, so you can focus on what comes next.</p>
          <div className="login-illustration" aria-hidden="true">
            <div className="login-orbit" />
            <div className="login-cross"><Cross /></div>
            <span className="orbit-label"><PackageCheck /> Products, organized.</span>
            <span className="orbit-label"><Truck /> Orders, in motion.</span>
          </div>
        </div>
        <div className="login-story-footer"><ShieldCheck size={17} /> Your dental supply business, connected.</div>
      </section>
      <section className="login-form-side" aria-label="Sign in">
        <div className="eyebrow">A little clarity. Every day.</div>
        <LoginForm />
        <p className="login-footer">MediShield · Dental supplies. Thoughtfully managed.</p>
      </section>
    </main>
  );
}

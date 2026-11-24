import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useMeeting } from "../../context/MeetingContext";
import { useNavigation } from "../../context/NavigationContext";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { useMagnetic } from "../../hooks/useMagnetic";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { sendAutomaticEmail, type EmailDeliveryResult } from "../../utils/emailDelivery";
import { SmartLink } from "../shell/SmartLink";

gsap.registerPlugin(ScrollTrigger);

interface FormErrors {
  name: string;
  email: string;
  company: string;
  desc: string;
}

const EMPTY_ERRORS: FormErrors = { name: "", email: "", company: "", desc: "" };

export function ContactScene() {
  const reducedMotion = useReducedMotion();
  const { openWhatsApp } = useWhatsApp();
  const { openMeetingModal } = useMeeting();
  const { scrollToTop } = useNavigation();

  const sectionRef = useRef<HTMLElement | null>(null);
  const emailCopyTimerRef = useRef<number | null>(null);
  const bookBtnRef = useMagnetic<HTMLButtonElement>(3);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [latestBrief, setLatestBrief] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<EmailDeliveryResult | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (emailCopyTimerRef.current !== null) {
        window.clearTimeout(emailCopyTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(WYNXSOL_CONFIG.contactEmail).then(() => {
      setEmailCopied(true);
      if (emailCopyTimerRef.current !== null) {
        window.clearTimeout(emailCopyTimerRef.current);
      }
      emailCopyTimerRef.current = window.setTimeout(() => {
        setEmailCopied(false);
      }, 2000);
    });
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    const ctx = gsap.context(() => {
      const lines = section.querySelectorAll(".contact-reveal-line");
      if (lines.length) {
        gsap.fromTo(
          lines,
          { yPercent: 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.72,
            stagger: 0.1,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [reducedMotion]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedCompany = company.trim();
    const trimmedDesc = desc.trim();

    const nextErrors: FormErrors = {
      name: trimmedName.length >= 2 ? "" : "Please enter your name.",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
        ? ""
        : "Please enter a valid business email.",
      company: trimmedCompany.length >= 2 ? "" : "Please enter your company name.",
      desc: trimmedDesc.length >= 12 ? "" : "Please describe your project (12+ chars).",
    };

    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.company || nextErrors.desc) {
      setLatestBrief("");
      setDeliveryResult(null);
      return;
    }

    const briefText = `Hi Wynx Solutions, I'd like to discuss a project.\nName: ${trimmedName}\nEmail: ${trimmedEmail}\nCompany: ${trimmedCompany}\nDetails: ${trimmedDesc}`;

    setIsSubmitting(true);
    const result = await sendAutomaticEmail({
      subject: `[Wynx Solutions Inquiry] ${trimmedCompany} — ${trimmedName}`,
      fromName: trimmedName,
      replyTo: trimmedEmail,
      fields: {
        Name: trimmedName,
        "Business Email": trimmedEmail,
        Company: trimmedCompany,
        "Project Summary": trimmedDesc,
      },
    });

    setDeliveryResult(result);
    setLatestBrief(briefText);
    setIsSubmitting(false);
  };

  return (
    <section
      ref={sectionRef}
      className="contact-scene"
      id="contact"
      data-scene-index="08 | 08"
      aria-labelledby="contact-heading"
    >
      <span id="scene-contact" style={{ position: "absolute", top: 0, left: 0 }} aria-hidden="true" />

      <div className="container contact-scene__inner">
        <span className="eyebrow-editorial">08 // Contact</span>
        <h2 className="contact-headline" id="contact-heading">
          <span className="line-mask">
            <span className="contact-reveal-line">LET&apos;S BUILD</span>
          </span>
          <span className="line-mask">
            <span className="contact-reveal-line text-chrome">WHAT&apos;S NEXT.</span>
          </span>
        </h2>

        <div className="contact-grid">
          <div>
            <p className="lead-copy" style={{ marginBottom: "1.5rem" }}>
              Have a business problem worth automating or an AI product worth engineering? Book a
              consultation call, email us directly, or start on WhatsApp.
            </p>

            <div className="contact-channel-card">
              <div className="contact-channel-row">
                <div>
                  <span className="contact-channel-label">Business Email</span>
                  <a
                    href={`mailto:${WYNXSOL_CONFIG.contactEmail}`}
                    className="contact-channel-email"
                    id="contact-email-link"
                  >
                    {WYNXSOL_CONFIG.contactEmail}
                  </a>
                </div>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  id="contact-copy-email"
                  onClick={handleCopyEmail}
                >
                  {emailCopied ? "Copied" : "Copy Email"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <button
                ref={bookBtnRef}
                type="button"
                className="btn btn--chrome"
                id="contact-book-meeting-btn"
                onClick={() => openMeetingModal()}
              >
                Book a Meeting
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => openWhatsApp()}
              >
                Contact Us on WhatsApp
              </button>
            </div>
          </div>

          <form id="wynx-contact-form" noValidate onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="cf-name">
                Name *
              </label>
              <input
                className="form-input"
                type="text"
                id="cf-name"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="form-error" id="err-name" aria-live="polite">
                {errors.name}
              </span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="cf-email">
                Business Email *
              </label>
              <input
                className="form-input"
                type="email"
                id="cf-email"
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="form-error" id="err-email" aria-live="polite">
                {errors.email}
              </span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="cf-company">
                Company *
              </label>
              <input
                className="form-input"
                type="text"
                id="cf-company"
                placeholder="Organisation"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <span className="form-error" id="err-company" aria-live="polite">
                {errors.company}
              </span>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="cf-desc">
                Project Summary *
              </label>
              <textarea
                className="form-textarea"
                id="cf-desc"
                rows={3}
                placeholder="Tell us what you are building..."
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <span className="form-error" id="err-desc" aria-live="polite">
                {errors.desc}
              </span>
            </div>

            <button type="submit" className="btn btn--outline" disabled={isSubmitting}>
              {isSubmitting ? "Sending Inquiry..." : "Send Inquiry & Prepare Brief"}
            </button>

            <div id="form-result-box" className="form-result-box" hidden={!latestBrief}>
              {deliveryResult && (
                <div
                  id="contact-delivery-status"
                  role="status"
                  aria-live="polite"
                  className={`contact-delivery-status contact-delivery-status--${
                    deliveryResult.status === "activation_required"
                      ? "activation"
                      : deliveryResult.status
                  }`}
                >
                  {deliveryResult.message}
                </div>
              )}
              <pre
                id="form-summary-preview"
                style={{ whiteSpace: "pre-wrap", fontSize: "12px", marginBottom: "0.75rem" }}
              >
                {latestBrief}
              </pre>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
                <button
                  type="button"
                  className="btn btn--chrome btn--sm"
                  id="btn-send-brief-wa"
                  onClick={() => {
                    if (latestBrief) openWhatsApp(latestBrief);
                  }}
                >
                  Send via WhatsApp
                </button>
                <a
                  href={`mailto:${WYNXSOL_CONFIG.contactEmail}?subject=${encodeURIComponent(
                    `Wynx Solutions Project Brief — ${company.trim()}`
                  )}&body=${encodeURIComponent(latestBrief)}`}
                  className="btn btn--outline btn--sm"
                  id="btn-send-brief-email"
                >
                  Open in Email App
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>

      <footer className="footer-monolith">
        <div className="container">
          <div className="footer-brand-lockup" aria-hidden="true">
            <img src={WYNXSOL_CONFIG.logoAssetPath} alt="" className="footer-logo-mark" />
            <div className="footer-wordmark">WYNX SOLUTIONS</div>
          </div>

          <div className="footer-meta-bar">
            <div className="footer-nav-links">
              <SmartLink to="/#company">Company</SmartLink>
              <SmartLink to="/#scene-capabilities">Capabilities</SmartLink>
              <SmartLink to="/#scene-process">Process</SmartLink>
              <SmartLink to="/restaurant-ai">Restaurant Intelligence &rarr;</SmartLink>
            </div>

            <div className="footer-meta-right">
              <a
                href={`mailto:${WYNXSOL_CONFIG.contactEmail}`}
                id="footer-email-link"
                className="footer-email-link"
              >
                {WYNXSOL_CONFIG.contactEmail}
              </a>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                id="footer-back-to-top"
                onClick={scrollToTop}
              >
                &uarr; Back to Top
              </button>
            </div>
          </div>

          <div className="footer-legal">
            <span>&copy; 2026 Wynx Solutions. Intelligence, Engineered.</span>
            <span>Pakistan &amp; International Delivery</span>
          </div>
        </div>
      </footer>
    </section>
  );
}

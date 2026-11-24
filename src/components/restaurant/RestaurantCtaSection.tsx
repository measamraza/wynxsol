import { WYNXSOL_CONFIG } from "../../config/wynxsol";
import { useMeeting } from "../../context/MeetingContext";
import { useNavigation } from "../../context/NavigationContext";
import { useWhatsApp } from "../../context/WhatsAppContext";
import { SmartLink } from "../shell/SmartLink";

export function RestaurantCtaSection() {
  const { openWhatsApp } = useWhatsApp();
  const { openMeetingModal } = useMeeting();
  const { scrollToTop } = useNavigation();

  return (
    <>
      <section
        className="restaurant-cta-monolith"
        id="restaurant-cta"
        data-scene-index="CH 03 | 03"
        aria-labelledby="rest-cta-heading"
      >
        <div className="container">
          <span className="eyebrow-editorial">Deploy Hospitality Vision</span>
          <h2
            className="serif-display"
            id="rest-cta-heading"
            style={{
              fontSize: "clamp(2.4rem, 5.8vw, 5.4rem)",
              textTransform: "uppercase",
              maxWidth: "15ch",
            }}
          >
            BRING FLOOR VISIBILITY TO YOUR RESTAURANT.
          </h2>
          <p className="lead-copy" style={{ marginTop: "1.1rem", maxWidth: "52ch" }}>
            Interested in piloting Restaurant Intelligence or building custom computer vision workflows
            for your venues? Book a demo call or reach us directly at{" "}
            <a
              href={`mailto:${WYNXSOL_CONFIG.contactEmail}`}
              style={{ color: "var(--text-primary)", textDecoration: "underline" }}
            >
              {WYNXSOL_CONFIG.contactEmail}
            </a>
            .
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
            <button
              type="button"
              className="btn btn--chrome"
              id="rest-book-meeting-btn"
              onClick={() => openMeetingModal("Restaurant Intelligence Demo")}
            >
              Book a Meeting
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() =>
                openWhatsApp(
                  "Hi Wynx Solutions, I'd like to discuss piloting Restaurant Intelligence for my restaurant."
                )
              }
            >
              Discuss Restaurant Intelligence on WhatsApp
            </button>
            <SmartLink to="/#contact" className="btn btn--outline">
              Go to Project Brief &amp; Contact
            </SmartLink>
            <SmartLink to="/#company" className="btn btn--outline">
              &larr; Return to Company
            </SmartLink>
          </div>
        </div>
      </section>

      <footer className="footer-monolith">
        <div className="container">
          <div className="footer-meta-bar" style={{ borderTop: "none", paddingTop: 0 }}>
            <div className="footer-nav-links">
              <SmartLink to="/#company">Company</SmartLink>
              <SmartLink to="/#scene-capabilities">Capabilities</SmartLink>
              <SmartLink to="/#contact">Contact</SmartLink>
            </div>
            <div className="footer-meta-right">
              <a href={`mailto:${WYNXSOL_CONFIG.contactEmail}`} className="footer-email-link">
                {WYNXSOL_CONFIG.contactEmail}
              </a>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                id="rest-back-to-top"
                onClick={scrollToTop}
              >
                &uarr; Back to Top
              </button>
            </div>
          </div>
          <div className="footer-legal">
            <span>&copy; 2026 Wynx Solutions. Restaurant Intelligence Study.</span>
            <span>Zero Facial Recognition &middot; Privacy-Conscious Computer Vision</span>
          </div>
        </div>
      </footer>
    </>
  );
}

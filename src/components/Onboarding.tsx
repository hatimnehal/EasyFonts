import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  FolderOpen,
  Keyboard,
  ShieldCheck,
  Type,
  Globe,
  Sliders,
  ChevronRight,
  ChevronLeft,
  X,
  Star,
  Check,
  Trash2,
} from "lucide-react";
import { Modal } from "./Modal";

export type OnboardingModalProps = {
  open: boolean;
  defaultFolder: string | null;
  busy: boolean;
  onChooseDefaultFolder: () => void;
  onClearDefaultFolder: () => void;
  onOpenOnlineFonts: () => void;
  onComplete: () => void;
};

export function OnboardingModal({
  open,
  defaultFolder,
  busy,
  onChooseDefaultFolder,
  onClearDefaultFolder,
  onOpenOnlineFonts,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (!open) return null;

  return (
    <Modal
      onClose={onComplete}
      label="Benvenuto in EasyFonts 2.0"
      className="onboarding-modal"
    >
      <div className="onboarding-dialog">
        {/* Header con pulsante chiusura */}
        <div className="onboarding-header">
          <div className="brand-badge">
            <Sparkles size={16} />
            <span>EasyFonts V2.0</span>
          </div>
          <button
            type="button"
            className="onboarding-close-btn"
            onClick={onComplete}
            aria-label="Chiudi guida di benvenuto"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="onboarding-stepper" role="tablist" aria-label="Fasi della guida">
          <button
            type="button"
            role="tab"
            aria-selected={step === 1}
            className={`step-tab ${step === 1 ? "active" : ""}`}
            onClick={() => setStep(1)}
          >
            <span className="step-num">1</span>
            <span className="step-label">Come funziona</span>
          </button>
          <div className="step-line" />
          <button
            type="button"
            role="tab"
            aria-selected={step === 2}
            className={`step-tab ${step === 2 ? "active" : ""}`}
            onClick={() => setStep(2)}
          >
            <span className="step-num">2</span>
            <span className="step-label">Strumenti Pro & Online</span>
          </button>
          <div className="step-line" />
          <button
            type="button"
            role="tab"
            aria-selected={step === 3}
            className={`step-tab ${step === 3 ? "active" : ""}`}
            onClick={() => setStep(3)}
          >
            <span className="step-num">3</span>
            <span className="step-label">Cartella di Lavoro</span>
          </button>
        </div>

        {/* Contenuto Step */}
        <div className="onboarding-body">
          {step === 1 && (
            <div className="step-content">
              <div className="step-intro">
                <h2>Come funziona EasyFonts</h2>
                <p>
                  EasyFonts è un font manager locale ad alte prestazioni. Ti permette di esplorare,
                  provare e selezionare caratteri tipografici in totale sicurezza e velocità.
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="card-icon">
                    <Type size={20} />
                  </div>
                  <div className="card-text">
                    <h3>Prova illimitata in memoria</h3>
                    <p>
                      Visualizza e digita direttamente dentro le anteprime (Positivo su bianco e Negativo
                      su nero) <strong>senza installare nulla nel sistema operativo</strong>. Clicca sul
                      testo e scrivi dal vivo!
                    </p>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="card-icon">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="card-text">
                    <h3>Estrazione & archivio automatico licenze</h3>
                    <p>
                      EasyFonts estrae e analizza le licenze (.txt, .pdf, EULA) categorizzando i font in
                      <strong> Uso commerciale</strong>, <strong>Solo personale</strong> o da verificare.
                    </p>
                  </div>
                </div>

                <div className="feature-card wide">
                  <div className="card-icon">
                    <Keyboard size={20} />
                  </div>
                  <div className="card-text">
                    <h3>Scorciatoie rapide da tastiera</h3>
                    <div className="shortcuts-list">
                      <div className="shortcut-item">
                        <kbd>G</kbd>
                        <span>Installa i font selezionati</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>V</kbd>
                        <span>Installa tutti i font della vista</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>R</kbd>
                        <span>Elimina con copia di backup sicura in <code>trash/</code></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <div className="step-intro">
                <h2>Strumenti Pro per Designer & Font Gratis Online</h2>
                <p>
                  Tutto ciò che serve al designer tipografico: controllo millimetrico dei caratteri
                  e accesso immediato a migliaia di font gratuiti da tutto il web.
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="card-icon">
                    <Sliders size={20} />
                  </div>
                  <div className="card-text">
                    <h3>Barra Tipografica & Variable Fonts</h3>
                    <p>
                      Regola Corpo (16..160px), Tracking (-0.08..0.25em), Interlinea (0.85..2.0), attiva
                      feature OpenType (<code>liga</code>, <code>smcp</code>, <code>tnum</code>, <code>zero</code>)
                      e assi variabili. Copia il CSS con un clic o esporta la tavola in PNG 1600x900.
                    </p>
                  </div>
                </div>

                <div className="feature-card">
                  <div className="card-icon">
                    <Layers size={20} />
                  </div>
                  <div className="card-text">
                    <h3>3 Nuove Viste Specimen</h3>
                    <p>
                      <strong>Waterfall:</strong> progressione di corpi da 12 a 96 px con testo live modificabile.
                      <br />
                      <strong>Mappa Glifi:</strong> esplora ogni singolo glifo con codici Unicode.
                      <br />
                      <strong>Font Pairing:</strong> accoppia titolo e corpo testo su positivo e negativo.
                    </p>
                  </div>
                </div>

                <div className="feature-card wide highlight">
                  <div className="card-icon">
                    <Globe size={20} />
                  </div>
                  <div className="card-text">
                    <h3>Cerca su DaFont, Google Fonts & Fontshare con Stella ★</h3>
                    <p>
                      Cerca tra migliaia di font online o incolla un link DaFont. Metti la <strong>Stella ★</strong>
                      a più font che ti piacciono e clicca <strong>"Scarica tutti"</strong> per importarli
                      tutti insieme in un unico clic nel tuo workspace!
                    </p>
                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="inline-cta-btn"
                        onClick={() => {
                          onComplete();
                          onOpenOnlineFonts();
                        }}
                      >
                        <Star size={14} />
                        <span>Apri ricerca font online ora →</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="step-intro">
                <h2>Scegli la Cartella di Lavoro Predefinita</h2>
                <p>
                  Seleziona una cartella sul tuo computer: EasyFonts la aprirà automaticamente a ogni
                  avvio e vi salverà i nuovi font scaricati da DaFont, Google Fonts o Fontshare.
                </p>
              </div>

              <div className="folder-selection-box">
                <div className="folder-status-row">
                  <div className="folder-icon-circle">
                    <FolderOpen size={24} />
                  </div>
                  <div className="folder-details">
                    <span className="folder-label">Cartella attiva:</span>
                    <span className="folder-path" title={defaultFolder || "Nessuna"}>
                      {defaultFolder || "Nessuna cartella predefinita selezionata"}
                    </span>
                  </div>
                </div>

                <div className="folder-actions">
                  <button
                    type="button"
                    className="folder-action-btn primary"
                    disabled={busy}
                    onClick={onChooseDefaultFolder}
                  >
                    <FolderOpen size={15} />
                    <span>{defaultFolder ? "Cambia cartella predefinita" : "Scegli cartella predefinita"}</span>
                  </button>

                  {defaultFolder && (
                    <button
                      type="button"
                      className="folder-action-btn danger"
                      disabled={busy}
                      onClick={onClearDefaultFolder}
                      title="Rimuovi cartella predefinita"
                    >
                      <Trash2 size={15} />
                      <span>Rimuovi</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="onboarding-ready-note">
                <Check size={16} />
                <span>Puoi sempre modificare o rimuovere la cartella dalle Impostazioni in qualsiasi momento.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer con pulsanti di navigazione */}
        <div className="onboarding-footer">
          {step > 1 ? (
            <button
              type="button"
              className="nav-btn prev"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            >
              <ChevronLeft size={16} />
              <span>Indietro</span>
            </button>
          ) : (
            <button
              type="button"
              className="nav-btn skip"
              onClick={onComplete}
            >
              <span>Salta guida</span>
            </button>
          )}

          <div className="footer-dots">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`dot ${step === dot ? "active" : ""}`}
                onClick={() => setStep(dot as 1 | 2 | 3)}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              type="button"
              className="nav-btn next"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            >
              <span>Avanti</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="nav-btn finish"
              onClick={onComplete}
            >
              <span>Inizia a progettare →</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-modal {
          max-width: 720px;
          width: 90vw;
          padding: 0;
          overflow: hidden;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
        }
        .onboarding-dialog {
          display: flex;
          flex-direction: column;
          color: var(--ink);
        }
        .onboarding-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--line);
        }
        .brand-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          color: #598058;
        }
        .onboarding-close-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        .onboarding-close-btn:hover {
          color: var(--ink);
          background: var(--hover);
        }
        .onboarding-stepper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 28px;
          background: var(--hover);
          border-bottom: 1px solid var(--line);
        }
        .step-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .step-tab.active {
          color: var(--ink);
          font-weight: 600;
          background: var(--panel);
        }
        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--line);
          font-size: 11px;
          font-weight: 700;
        }
        .step-tab.active .step-num {
          background: #598058;
          color: #fff;
        }
        .step-line {
          flex: 1;
          height: 1px;
          background: var(--line);
          margin: 0 12px;
        }
        .onboarding-body {
          padding: 24px 28px;
          min-height: 380px;
          display: flex;
          flex-direction: column;
        }
        .step-intro {
          margin-bottom: 20px;
        }
        .step-intro h2 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.4px;
        }
        .step-intro p {
          margin: 0;
          font-size: 13px;
          color: var(--muted);
          line-height: 1.5;
        }
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
        .feature-card {
          display: flex;
          gap: 12px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 14px;
        }
        .feature-card.wide {
          grid-column: 1 / -1;
        }
        .feature-card.highlight {
          border-color: #acc1a5;
          background: var(--hover);
        }
        .card-icon {
          color: #598058;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .card-text h3 {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
        }
        .card-text p {
          margin: 0;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.45;
        }
        .shortcuts-list {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 8px;
        }
        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--muted);
        }
        kbd {
          display: inline-block;
          padding: 2px 7px;
          font-size: 11px;
          font-family: monospace;
          font-weight: 700;
          color: var(--ink);
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 4px;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
        }
        .inline-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          background: #598058;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: 0;
        }
        .inline-cta-btn:hover {
          opacity: 0.9;
        }
        .folder-selection-box {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .folder-status-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .folder-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: var(--hover);
          color: #598058;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .folder-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .folder-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
        }
        .folder-path {
          font-size: 13px;
          font-weight: 550;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: monospace;
        }
        .folder-actions {
          display: flex;
          gap: 10px;
        }
        .folder-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
          transition: all 0.15s ease;
        }
        .folder-action-btn:hover {
          background: var(--hover);
        }
        .folder-action-btn.primary {
          background: var(--ink);
          color: var(--bg);
          border-color: var(--ink);
        }
        .folder-action-btn.danger {
          color: #b8463d;
          border-color: #f0cfcc;
        }
        .folder-action-btn.danger:hover {
          background: #fdf2f2;
        }
        .onboarding-ready-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 12px;
          color: var(--muted);
        }
        .onboarding-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid var(--line);
          background: var(--hover);
        }
        .nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink);
        }
        .nav-btn:hover {
          background: var(--hover);
        }
        .nav-btn.finish {
          background: #598058;
          color: #fff;
          border-color: #598058;
          font-weight: 600;
          padding: 8px 18px;
        }
        .nav-btn.finish:hover {
          opacity: 0.9;
        }
        .footer-dots {
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--line);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .dot.active {
          background: #598058;
          width: 16px;
          border-radius: 4px;
        }
      `}</style>
    </Modal>
  );
}
export default OnboardingModal;

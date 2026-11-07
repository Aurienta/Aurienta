// AURIENTA — Compliance Certifications Module (SOC 2 / ISO 27001 / PDPL)
// Tracks certification readiness and audit evidence.
// Legal: NOT legal advice. Administrative tracking only (Law 17/1983 Art. 1).

import { db } from "@/lib/db";
import { audit } from "./audit";
import { logger } from "./logger";

export type CertStandard = "SOC2" | "ISO27001" | "PDPL" | "GDPR" | "PCI_DSS";
export type CertStatus = "not_started" | "in_progress" | "audit_ready" | "certified" | "expired";

export type CertificationTrack = {
  id: string;
  enterpriseId: string;
  standard: CertStandard;
  status: CertStatus;
  readinessScore: number; // 0-100
  controlsTotal: number;
  controlsPassed: number;
  controlsFailed: number;
  lastAssessed: Date;
  targetCertificationDate?: Date;
};

const STANDARD_CONTROLS: Record<CertStandard, string[]> = {
  SOC2: [
    "CC1: Control Environment",
    "CC2: Communication and Information",
    "CC3: Risk Assessment",
    "CC4: Monitoring Activities",
    "CC5: Control Activities",
    "A1: Availability",
    "C1: Confidentiality",
    "PI1: Processing Integrity",
    "P1: Privacy",
  ],
  ISO27001: [
    "A.5: Information Security Policies",
    "A.6: Organization of Information Security",
    "A.7: Human Resource Security",
    "A.8: Asset Management",
    "A.9: Access Control",
    "A.10: Cryptography",
    "A.11: Physical Security",
    "A.12: Operations Security",
    "A.13: Communications Security",
    "A.14: System Acquisition/Development",
    "A.15: Supplier Relationships",
    "A.16: Incident Management",
    "A.17: Business Continuity",
    "A.18: Compliance",
  ],
  PDPL: [
    "Art. 2: Lawful Basis for Processing",
    "Art. 5: Data Protection Officer",
    "Art. 7: Consent Management",
    "Art. 10: Data Breach Response Plan",
    "Art. 13: Data Subject Rights",
    "Art. 17: Cross-Border Transfer Safeguards",
    "Art. 22: Data Protection Impact Assessment",
    "Art. 24: Breach Notification (72h)",
    "Art. 30: Registration with PDPC",
  ],
  GDPR: ["Art. 6: Lawful Basis", "Art. 7: Consent", "Art. 33: Breach Notification"],
  PCI_DSS: ["Req 1: Firewall", "Req 2: Default Passwords", "Req 3: Stored Data", "Req 4: Encryption in Transit"],
};

export async function assessReadiness(params: {
  enterpriseId: string;
  standard: CertStandard;
  assessedBy: string;
}): Promise<CertificationTrack> {
  const controls = STANDARD_CONTROLS[params.standard] || [];
  const controlsPassed = Math.floor(controls.length * 0.6); // 60% in sandbox
  const readinessScore = Math.round((controlsPassed / controls.length) * 100);

  const track: CertificationTrack = {
    id: `cert-${params.standard}-${Date.now()}`,
    enterpriseId: params.enterpriseId,
    standard: params.standard,
    status: readinessScore >= 80 ? "audit_ready" : "in_progress",
    readinessScore,
    controlsTotal: controls.length,
    controlsPassed,
    controlsFailed: controls.length - controlsPassed,
    lastAssessed: new Date(),
  };

  await audit({
    actorId: params.assessedBy,
    action: "compliance_cert_assessed",
    target: `compliance_cert:${track.id}`,
    result: "allowed",
    metadata: { ...track, controls: STANDARD_CONTROLS[params.standard] },
  });

  logger.info("Compliance readiness assessed", { ...track });
  return track;
}

export async function getCertifications(enterpriseId: string): Promise<CertificationTrack[]> {
  const records = await db.auditLog.findMany({
    where: { action: "compliance_cert_assessed", target: { contains: "compliance_cert:" } },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  const tracks = new Map<string, CertificationTrack>();
  for (const r of records) {
    const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata as any;
    if (meta.enterpriseId === enterpriseId && !tracks.has(meta.standard)) {
      tracks.set(meta.standard, meta);
    }
  }
  return [...tracks.values()];
}

export { STANDARD_CONTROLS };

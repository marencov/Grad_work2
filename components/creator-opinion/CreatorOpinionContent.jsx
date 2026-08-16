import LifeSupportOpinion from "@/content/creator-opinions/life-support-treatment.mdx";
import PaidAmbulanceOpinion from "@/content/creator-opinions/paid-ambulance.mdx";
import PhysicalRestraintOpinion from "@/content/creator-opinions/physical-restraint.mdx";
import AedOpinion from "@/content/creator-opinions/aed-for-collapsed-woman.mdx";
import TelemedicineOpinion from "@/content/creator-opinions/expansion-of-telemedicine.mdx";
import ElderlyCopaymentOpinion from "@/content/creator-opinions/elderly-copayment-30-percent.mdx";
import MedicalErrorOpinion from "@/content/creator-opinions/license-revocation-for-medical-errors.mdx";
import AiDiagnosisOpinion from "@/content/creator-opinions/ai-medical-diagnosis.mdx";
import MedicalAdvertisingOpinion from "@/content/creator-opinions/liberalization-of-medical-advertising.mdx";
import PersonalResponsibilityOpinion from "@/content/creator-opinions/personal-responsibility-medical-costs.mdx";
import PrivatePracticeOpinion from "@/content/creator-opinions/prescription-in-private-practice.mdx";
import EuthanasiaOpinion from "@/content/creator-opinions/legalization-of-active-euthanasia.mdx";
import WaitingTimeOpinion from "@/content/creator-opinions/shorter-consultations-to-reduce-waiting.mdx";
import AntibioticsOpinion from "@/content/creator-opinions/antibiotics-for-common-cold.mdx";

const OPINIONS = {
  "life-support-treatment": LifeSupportOpinion,
  "paid-ambulance": PaidAmbulanceOpinion,
  "physical-restraint": PhysicalRestraintOpinion,
  "aed-for-collapsed-woman": AedOpinion,
  "expansion-of-telemedicine": TelemedicineOpinion,
  "elderly-copayment-30-percent": ElderlyCopaymentOpinion,
  "license-revocation-for-medical-errors": MedicalErrorOpinion,
  "ai-medical-diagnosis": AiDiagnosisOpinion,
  "liberalization-of-medical-advertising": MedicalAdvertisingOpinion,
  "personal-responsibility-medical-costs": PersonalResponsibilityOpinion,
  "prescription-in-private-practice": PrivatePracticeOpinion,
  "legalization-of-active-euthanasia": EuthanasiaOpinion,
  "shorter-consultations-to-reduce-waiting": WaitingTimeOpinion,
  "antibiotics-for-common-cold": AntibioticsOpinion,
};

export default function CreatorOpinionContent({ questionSlug }) {
  const Content = OPINIONS[questionSlug];
  if (!Content) return null;
  return <Content />;
}

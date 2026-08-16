import InformationPage, { InfoSection } from "@/components/InformationPage";
import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "ご意見・ご感想 | CrossTalk",
  description: "CrossTalkへのお問い合わせページです。",
};

export default function ContactPage() {
  return (
    <InformationPage
      eyebrow="Contact"
      title="ご意見・ご感想"
      description="サイトへのご意見、掲載テーマの提案、不具合の報告など、どんなことでも遠慮なくお聞かせください。率直なご意見をお待ちしています。"
    >
      <InfoSection title="お問い合わせの前に">
        <p>
          お送りいただいた内容は制作者だけが確認し、お問い合わせへの対応と卒業制作の改善に使用します。医療相談や緊急のご相談には対応できません。
        </p>
      </InfoSection>
      <ContactForm />
    </InformationPage>
  );
}

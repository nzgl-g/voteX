import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shadcn-ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "How secure is blockchain voting?",
    answer:
        "Blockchain voting leverages cryptographic protocols and distributed ledgers to ensure votes are tamper-proof, verifiable, and secure.",
    value: "item-1",
  },
  {
    question: "Can I verify that my vote was counted?",
    answer:
        "Yes. Each vote is assigned a unique cryptographic ID, allowing voters to verify inclusion in the final count without revealing identity.",
    value: "item-2",
  },
  {
    question: "How does your KYC system work?",
    answer:
        "Our KYC system verifies voter identity using document checks, facial recognition, and metadata validation. It ensures each voter is real, eligible, and unique—without compromising privacy.",
    value: "item-3",
  },
  {
    question: "Is this system accessible for remote voters?",
    answer:
        "Absolutely. Our platform is designed to be device-agnostic, enabling secure voting from anywhere with an internet connection.",
    value: "item-4",
  },
  {
    question: "What happens if the internet goes down during voting?",
    answer:
        "Votes are submitted as signed transactions. If offline, votes are queued and sent when connectivity resumes, ensuring resilience.",
    value: "item-5",
  },
  {
    question: "How do you prevent double voting or fraud?",
    answer:
        "Identity verification and blockchain consensus mechanisms ensure one vote per verified voter—no duplicates, no funny business.",
    value: "item-6",
  },
];

export const FAQSection = () => {
  return (
      <section id="faq" className="container md:w-[700px] py-24 sm:py-32 flex flex-col items-center">
        <div className="text-center mb-8 w-full">
          <h2 className="text-lg text-primary text-center mb-2 tracking-wider font-semibold">
            FAQS
          </h2>

          <h2 className="text-3xl md:text-4xl text-center font-bold mx-auto">
            Common Questions About Blockchain Voting
          </h2>
        </div>

        <Accordion type="single" collapsible className="AccordionRoot w-full">
          {FAQList.map(({ question, answer, value }) => (
              <AccordionItem key={value} value={value}>
                <AccordionTrigger className="text-left">
                  {question}
                </AccordionTrigger>

                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
          ))}
        </Accordion>
      </section>
  );
};

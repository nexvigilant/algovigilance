export interface LegalCalloutData {
  title: string;
  content: string;
  variant: 'cyan' | 'gold';
}

export const agreementCallout: LegalCalloutData = {
  title: 'Agreement to Terms',
  content:
    'By accessing or using AlgoVigilance services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.',
  variant: 'cyan',
};

export const commitmentCallout: LegalCalloutData = {
  title: 'Our Commitment',
  content:
    'AlgoVigilance is committed to independence, transparency, and putting healthcare professionals first. These Terms reflect our founding principles: we do not accept pharmaceutical company funding that could compromise our objectivity, we provide transparent education without conflicts of interest, and we believe professional development should be accessible to all who seek to advance their capabilities.',
  variant: 'cyan',
};

export const foundingMemberCallout: LegalCalloutData = {
  title: 'Important Clarification',
  content:
    'Founding Member status includes lifetime access to our platform at locked-in pricing, priority support, and early access to new features. Membership is a subscription—it does not include equity, voting rights, or governance participation in AlgoVigilance, LLC.',
  variant: 'gold',
};

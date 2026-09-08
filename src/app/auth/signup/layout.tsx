import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Host Account',
  description: 'Join Bhind by TheScene. Start listing events, selling tickets, and managing guest rosters.',
  alternates: {
    canonical: '/auth/signup',
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

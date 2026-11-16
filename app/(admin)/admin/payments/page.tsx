import type { Metadata } from 'next';
import { CounterPaymentsPage } from '@/components/admin/CounterPaymentsPage';

export const metadata: Metadata = { title: 'Counter payments' };

export default function Page() {
  return <CounterPaymentsPage />;
}

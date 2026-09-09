import { redirect } from 'next/navigation';
export default function RedirectPage() {
  redirect('/author/withdrawals/request');
}

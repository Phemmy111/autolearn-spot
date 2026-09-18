import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { TermsAcceptanceForm } from './TermsAcceptanceForm';

export default async function AuthorTermsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch author data
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (!author) {
    redirect('/author-auth');
  }

  const currentTermsVersion = '2026-09-01';
  const hasAcceptedCurrentTerms = author.accepted_terms_version === currentTermsVersion;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text mb-2">
          Author Terms & Conditions
        </h1>
        <p className="text-brand-text/70">
          Please read and accept the terms to continue creating products
        </p>
      </div>

      <div className="bg-[var(--card)] brightness-95 border border-brand-border rounded-lg p-8">
        <div className="prose prose-sm max-w-none text-brand-text">
          <h2 className="text-lg font-semibold mb-4">By becoming an AutoLearn Spot Author, you agree to the following:</h2>
          
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-brand-text mb-2">Your Content</h3>
              <p className="text-brand-text/80">
                You are responsible for ensuring that every course, lesson, video, document, image, assignment and other material you upload is original or that you have the necessary rights to use it.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Your Products</h3>
              <p className="text-brand-text/80">
                You are responsible for the accuracy, quality and educational value of your learning products. AutoLearn Spot may review products before publication.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Pricing & Earnings</h3>
              <p className="text-brand-text/80">
                You may set product prices within AutoLearn Spot's rules. Applicable platform fees, commissions and payment-related charges will be deducted according to the applicable commercial terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Student Communication</h3>
              <p className="text-brand-text/80">
                Use AutoLearn Spot's communication tools for student support and course-related communication. Do not solicit students away from AutoLearn Spot or redirect them to personal WhatsApp numbers, private payment channels or competing platforms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Live Classes</h3>
              <p className="text-brand-text/80">
                Live classes must be relevant to the learning product and conducted professionally. Students should receive reasonable notice of scheduled sessions.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Student Privacy</h3>
              <p className="text-brand-text/80">
                Do not misuse, export, sell or share student information obtained through AutoLearn Spot.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Prohibited Content</h3>
              <p className="text-brand-text/80">
                Do not upload illegal, fraudulent, hateful, sexually explicit, infringing, misleading or otherwise prohibited content.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Platform Rights</h3>
              <p className="text-brand-text/80">
                AutoLearn Spot may review, suspend, unpublish or remove content that violates these terms, applicable law or platform policies.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Existing Students</h3>
              <p className="text-brand-text/80">
                If an author account or product is suspended or terminated, AutoLearn Spot may continue providing purchased students with access to products they are entitled to receive, subject to applicable policies and commercial terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-brand-text mb-2">Agreement</h3>
              <p className="text-brand-text/80">
                By creating and submitting a learning product on AutoLearn Spot, you confirm that you have read, understood and agreed to these Author Terms & Conditions.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border">
          <TermsAcceptanceForm 
            authorId={author.id}
            hasAccepted={hasAcceptedCurrentTerms}
            currentVersion={currentTermsVersion}
          />
        </div>
      </div>
    </div>
  );
}
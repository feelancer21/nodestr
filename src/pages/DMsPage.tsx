import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DMsPage() {
  return (
    <section className="grid gap-6">
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">DMs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-200">
          Operator-only DMs will activate in Phase 9.
        </CardContent>
      </Card>
    </section>
  );
}

export default DMsPage;

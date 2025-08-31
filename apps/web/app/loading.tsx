import { Spinner, CenteredPageLayout } from '@repo/ui';

export default function GlobalLoading() {
  return (
    <CenteredPageLayout maxWidth="sm">
      <Spinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
      <p className="text-muted-foreground">Please wait while we load the application</p>
    </CenteredPageLayout>
  );
}

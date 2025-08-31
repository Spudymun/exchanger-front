import { Spinner, CenteredPageLayout } from '@repo/ui';

export default function Loading() {
  return (
    <CenteredPageLayout maxWidth="md">
      <Spinner size="xl" className="mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground">Загрузка панели администратора...</h2>
      <p className="text-muted-foreground mt-2">Пожалуйста, подождите</p>
    </CenteredPageLayout>
  );
}

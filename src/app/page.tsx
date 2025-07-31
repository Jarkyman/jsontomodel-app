import { ThemeToggle } from '@/components/theme-toggle';
import ModelForgeLoader from '@/components/ModelForgeLoader';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <ModelForgeLoader />
    </main>
  );
}

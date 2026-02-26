import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex h-[80vh] w-full flex-col items-center justify-center bg-background px-4">
            <div className="rounded-full bg-muted p-6 mb-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 text-foreground">Page Not Found</h1>
            <p className="text-muted-foreground text-center max-w-md mb-8">
                We couldn't find the page you're looking for. It might have been moved or the URL might be incorrect.
            </p>
            <Link href="/">
                <Button size="lg">Return Home</Button>
            </Link>
        </div>
    );
}

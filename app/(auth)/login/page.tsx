import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Jewelry ERP</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the system
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
